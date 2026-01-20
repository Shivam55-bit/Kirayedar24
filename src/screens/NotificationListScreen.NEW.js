import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../services/notificationapi';

/**
 * ✅ UNIFIED NOTIFICATION LIST SCREEN
 * - Backend API = ONLY source of truth
 * - NO local AsyncStorage notifications
 * - Type-based navigation
 * - Read/unread sync via API
 * - Delete functionality
 * - Pagination support
 * - WhatsApp-level reliability
 */
const NotificationListScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load notifications from API (ONLY SOURCE)
  const loadNotifications = useCallback(async (pageNum = 1, showLoader = true) => {
    try {
      if (showLoader && pageNum === 1) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      const response = await getNotifications(pageNum, 20);

      if (__DEV__) {
        console.log(`📥 Notifications API (page ${pageNum}):`, response);
      }

      if (!response.success) {
        if (response.message) {
          Alert.alert('Error', response.message);
        }
        return;
      }

      // Handle different response structures
      let newNotifications = [];
      let pagination = {};

      if (response.data) {
        // New structure: { data: { notifications: [], pagination: {} } }
        newNotifications = response.data.notifications || response.data || [];
        pagination = response.data.pagination || {};
      } else {
        // Old structure: { success: true, data: [] }
        newNotifications = response.data || [];
      }

      if (pageNum === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      // Update pagination state
      if (pagination.totalPages) {
        setHasMore(pagination.page < pagination.totalPages);
      } else {
        // If no pagination info, assume no more if less than limit
        setHasMore(newNotifications.length >= 20);
      }
      
      setPage(pageNum);
    } catch (err) {
      if (__DEV__) console.error('❌ Notification API Error:', err);
      Alert.alert('Error', 'Unable to fetch notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Load unread count (for badge)
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      
      if (response.success) {
        const count = response.data?.count || 0;
        setUnreadCount(count);
        
        // Update app badge count
        DeviceEventEmitter.emit('notification_badge_updated', { count });
      }
    } catch (err) {
      if (__DEV__) console.error('❌ Unread count error:', err);
    }
  }, []);

  // Mark notification as read (API + UI)
  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      // Optimistic UI update
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, is_read: true, isRead: true } : n
        )
      );

      // API call
      const response = await markNotificationAsRead(notificationId);
      
      if (response.success) {
        await loadUnreadCount(); // Refresh badge count
        
        if (__DEV__) console.log('✅ Notification marked as read');
      } else {
        // Revert optimistic update
        await loadNotifications(1, false);
      }
    } catch (err) {
      if (__DEV__) console.error('❌ Mark as read error:', err);
      await loadNotifications(1, false); // Revert
    }
  }, [loadNotifications, loadUnreadCount]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.success) {
        // Refresh notifications and badge
        await Promise.all([
          loadNotifications(1, false),
          loadUnreadCount()
        ]);
        
        if (__DEV__) console.log('✅ All notifications marked as read');
      }
    } catch (err) {
      if (__DEV__) console.error('❌ Mark all as read error:', err);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  }, [loadNotifications, loadUnreadCount]);

  // Delete notification
  const handleDeleteNotification = useCallback(async (notificationId) => {
    try {
      // Optimistic UI update
      setNotifications(prev => prev.filter(n => n._id !== notificationId));

      const response = await deleteNotification(notificationId);
      
      if (!response.success) {
        // Revert on failure
        await loadNotifications(1, false);
        Alert.alert('Error', 'Failed to delete notification');
      } else {
        await loadUnreadCount();
        if (__DEV__) console.log('✅ Notification deleted');
      }
    } catch (err) {
      if (__DEV__) console.error('❌ Delete notification error:', err);
      await loadNotifications(1, false);
    }
  }, [loadNotifications, loadUnreadCount]);

  // Delete all notifications
  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteAllNotifications();
              if (response.success) {
                setNotifications([]);
                setUnreadCount(0);
                DeviceEventEmitter.emit('notification_badge_updated', { count: 0 });
                
                if (__DEV__) console.log('✅ All notifications deleted');
              } else {
                Alert.alert('Error', 'Failed to delete all notifications');
              }
            } catch (err) {
              if (__DEV__) console.error('❌ Delete all error:', err);
              Alert.alert('Error', 'Failed to delete all notifications');
            }
          },
        },
      ]
    );
  }, []);

  // Handle notification tap
  const handleNotificationTap = useCallback(async (notification) => {
    // Mark as read if unread
    const isUnread = notification.is_read === false || notification.isRead === false;
    if (isUnread) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate based on type
    const type = notification.type;
    const reference_id = notification.reference_id;
    const extra_data = notification.extra_data || {};

    if (__DEV__) {
      console.log('🔔 Notification tapped:', { type, reference_id, extra_data });
    }

    switch (type) {
      case 'chat_message':
        if (reference_id) {
          navigation.navigate('ChatDetailScreen', { 
            chatId: reference_id,
            otherUserId: extra_data.sender_id 
          });
        } else {
          navigation.navigate('ChatListScreen');
        }
        break;

      case 'admin_announcement':
        // Show detail modal or stay on notification screen
        Alert.alert(
          notification.title || 'Announcement',
          notification.body || notification.message || '',
          [{ text: 'OK' }]
        );
        break;

      case 'payment_update':
        navigation.navigate('PaymentHistoryScreen');
        break;

      case 'subscription_status':
        navigation.navigate('SubscriptionScreen');
        break;

      case 'property_update':
        if (reference_id) {
          navigation.navigate('PropertyDetailsScreen', { itemId: reference_id });
        } else {
          navigation.navigate('AllPropertiesScreen');
        }
        break;

      case 'inquiry_response':
        navigation.navigate('MyBookingsScreen', { tab: 'inquiries' });
        break;

      case 'system_alert':
        Alert.alert(
          notification.title || 'System Alert',
          notification.body || notification.message || '',
          [{ text: 'OK' }]
        );
        break;

      default:
        if (__DEV__) console.warn('⚠️ Unknown notification type:', type);
        // For unknown types, just show the message
        if (notification.title || notification.body || notification.message) {
          Alert.alert(
            notification.title || 'Notification',
            notification.body || notification.message || '',
            [{ text: 'OK' }]
          );
        }
    }
  }, [handleMarkAsRead, navigation]);

  // Long press to delete
  const handleLongPress = useCallback((notification) => {
    Alert.alert(
      'Delete Notification',
      'Do you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteNotification(notification._id),
        },
      ]
    );
  }, [handleDeleteNotification]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat_message': return 'chatbubble-outline';
      case 'admin_announcement': return 'megaphone-outline';
      case 'payment_update': return 'card-outline';
      case 'subscription_status': return 'star-outline';
      case 'property_update': return 'home-outline';
      case 'inquiry_response': return 'mail-outline';
      case 'system_alert': return 'warning-outline';
      default: return 'notifications-outline';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'chat_message': return '#FF9800';
      case 'admin_announcement': return '#F44336';
      case 'payment_update': return '#4CAF50';
      case 'subscription_status': return '#9C27B0';
      case 'property_update': return '#2196F3';
      case 'inquiry_response': return '#00BCD4';
      case 'system_alert': return '#FF5722';
      default: return '#666';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (isNaN(diffInMinutes)) return date.toLocaleDateString();

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString();
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadNotifications(1, false),
      loadUnreadCount()
    ]);
  }, [loadNotifications, loadUnreadCount]);

  // Load more notifications (pagination)
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      loadNotifications(page + 1, false);
    }
  }, [loadingMore, loading, hasMore, page, loadNotifications]);

  // Initial load
  useEffect(() => {
    loadNotifications(1);
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Listen for FCM notifications (refresh when received)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'fcm_notification_received',
      () => {
        if (__DEV__) console.log('📬 FCM received, refreshing notifications...');
        loadNotifications(1, false);
        loadUnreadCount();
      }
    );

    return () => subscription.remove();
  }, [loadNotifications, loadUnreadCount]);

  // Render notification item
  const renderNotificationItem = ({ item }) => {
    const isUnread = item.is_read === false || item.isRead === false;
    const title = item.title || 'Notification';
    const message = item.body || item.message || '';
    const timestamp = item.created_at || item.createdAt || item.timestamp;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.unreadNotification
        ]}
        onPress={() => handleNotificationTap(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.type) + '20' }
          ]}
        >
          <Icon
            name={getNotificationIcon(item.type)}
            size={24}
            color={getNotificationColor(item.type)}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, isUnread && styles.unreadTitle]}>
              {title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>

          <Text style={styles.timestamp}>
            {formatTimestamp(timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && page === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#FDB022" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FDB022" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FDB022" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
        
        {notifications.length > 0 && (
          <>
            {unreadCount > 0 && (
              <TouchableOpacity 
                onPress={handleMarkAllAsRead} 
                style={styles.markAllButton}
              >
                <Icon name="checkmark-done-outline" size={20} color="#FDB022" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleDeleteAll} style={styles.clearButton}>
              <Icon name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyMessage}>
            You'll see notifications about messages, announcements, and updates here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#FDB022']}
              tintColor="#FDB022"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#FDB022" />
                <Text style={styles.footerLoaderText}>Loading more...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: { 
    padding: 8, 
    marginLeft: -8 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 8,
  },
  badgeContainer: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  markAllButton: {
    padding: 8,
    marginRight: 8,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#666' 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: { 
    padding: 16 
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#FDB022',
    backgroundColor: '#fffaf0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: { 
    flex: 1 
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1a1a1a', 
    flex: 1 
  },
  unreadTitle: { 
    fontWeight: '700', 
    color: '#1a1a1a' 
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FDB022',
    marginLeft: 8,
  },
  message: { 
    fontSize: 14, 
    color: '#666', 
    lineHeight: 20, 
    marginBottom: 8 
  },
  timestamp: { 
    fontSize: 12, 
    color: '#999' 
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerLoaderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
});

export default NotificationListScreen;
