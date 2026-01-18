import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getNotificationList, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  deleteNotification,
  deleteAllNotifications,
  markAllNotificationsAsRead
} from '../services/api';

const NotificationListScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from API
  const loadNotifications = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      
      const response = await getNotificationList(pageNum, 20);
      
      if (response.success && response.data) {
        const newNotifications = response.data.notifications || response.data || [];
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        
        // Check if there are more notifications
        setHasMore(newNotifications.length === 20);
        
        // Load unread count
        loadUnreadCount();
      } else {
        console.warn('Failed to load notifications:', response.message);
        // Fallback to local storage if API fails
        await loadLocalNotifications();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to local storage
      await loadLocalNotifications();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load notifications from local AsyncStorage (fallback)
  const loadLocalNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_notifications');
      if (stored) {
        const notificationsList = JSON.parse(stored);
        const sortedNotifications = notificationsList.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setNotifications(sortedNotifications);
      }
    } catch (error) {
      console.error('Error loading local notifications:', error);
    }
  };

  // Load unread notification count
  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount();
      if (response.success) {
        const count = response.data?.count || response.data?.unreadCount || 0;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await deleteAllNotifications();
              
              if (response.success) {
                setNotifications([]);
                setUnreadCount(0);
                Alert.alert('Success', 'All notifications cleared');
              } else {
                Alert.alert('Error', response.message || 'Failed to clear notifications');
              }
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await markNotificationAsRead(notificationId);
      
      if (response.success) {
        // Update local state
        const updatedNotifications = notifications.map(notification =>
          notification._id === notificationId || notification.id === notificationId
            ? { ...notification, read: true, isRead: true }
            : notification
        );
        
        setNotifications(updatedNotifications);
        loadUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete a single notification
  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteNotification(notificationId);
              
              if (response.success) {
                setNotifications(prev => 
                  prev.filter(n => n._id !== notificationId && n.id !== notificationId)
                );
                loadUnreadCount();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete notification');
              }
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await markAllNotificationsAsRead();
      
      if (response.success) {
        const updatedNotifications = notifications.map(n => ({ ...n, read: true, isRead: true }));
        setNotifications(updatedNotifications);
        setUnreadCount(0);
        Alert.alert('Success', 'All notifications marked as read');
      } else {
        Alert.alert('Error', response.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  // Handle notification tap
  const handleNotificationTap = async (notification) => {
    // Mark as read
    const notifId = notification._id || notification.id;
    await markAsRead(notifId);
    
    // Navigate based on notification type
    if (notification.type === 'new_property' && notification.propertyId) {
      navigation.navigate('PropertyDetailsScreen', { itemId: notification.propertyId });
    } else if (notification.type === 'inquiry' && notification.inquiryId) {
      navigation.navigate('MyBookingsScreen', { tab: 'inquiries' });
    } else if (notification.type === 'chat' && notification.chatId) {
      navigation.navigate('ChatDetailScreen', { chatId: notification.chatId });
    }
  };

  // Load more notifications (pagination)
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotifications(nextPage, true);
    }
  };

  // Refresh notifications
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadNotifications(1, false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotifications(1, false);
    });
    return unsubscribe;
  }, [navigation]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_property': return 'home-outline';
      case 'inquiry': return 'mail-outline';
      case 'chat': return 'chatbubble-outline';
      case 'service': return 'construct-outline';
      case 'system': return 'notifications-outline';
      default: return 'information-circle-outline';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_property': return '#4CAF50';
      case 'inquiry': return '#2196F3';
      case 'chat': return '#FF9800';
      case 'service': return '#9C27B0';
      case 'system': return '#F44336';
      default: return '#666';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Render notification item
  const renderNotificationItem = ({ item }) => {
    const notifId = item._id || item.id;
    const isRead = item.read || item.isRead || false;
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !isRead && styles.unreadNotification
        ]}
        onPress={() => handleNotificationTap(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
          <Icon 
            name={getNotificationIcon(item.type)} 
            size={24} 
            color={getNotificationColor(item.type)} 
          />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !isRead && styles.unreadTitle]}>
              {item.title}
            </Text>
            {!isRead && <View style={styles.unreadDot} />}
          </View>
          
          <Text style={styles.message} numberOfLines={2}>
            {item.message || item.body || item.description}
          </Text>
          
          <View style={styles.footerRow}>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp || item.createdAt)}
            </Text>
            
            <TouchableOpacity
              onPress={() => handleDeleteNotification(notifId)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="trash-outline" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
        
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.notificationImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FDB022" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.actionButton}>
              <Icon name="checkmark-done-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAllNotifications} style={styles.actionButton}>
              <Icon name="trash-outline" size={20} color="#FF5252" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {notifications.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyMessage}>
            You'll see notifications about new properties, inquiries, and messages here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => (item._id || item.id || item.timestamp).toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#FDB022']}
              tintColor="#FDB022"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            loading && hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#FDB022" />
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
    backgroundColor: '#f8f9fa',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
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
    padding: 16,
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
    backgroundColor: '#f0f8ff',
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
    flex: 1,
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
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#FDB022',
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
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 4,
  },
  notificationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 12,
  },
});

export default NotificationListScreen;
