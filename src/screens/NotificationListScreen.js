import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  deleteNotification,
} from '../services/notificationapi';

const NotificationListScreen = ({ navigation }) => {
  /* ================= STATES ================= */
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isMounted = useRef(true);
  const loadingRef = useRef(false);

  /* ================= API ================= */

  const loadNotifications = useCallback(async (pageNum = 1) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      if (pageNum === 1) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      const res = await getNotifications(pageNum, 20);
      if (!isMounted.current) return;

      let list = [];
      let pagination = {};

      if (res?.data?.data) {
        list = res.data.data;
        pagination = res.data.pagination || {};
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      }

      setNotifications(prev =>
        pageNum === 1 ? list : [...prev, ...list]
      );

      setHasMore(
        pagination.totalPages
          ? pagination.page < pagination.totalPages
          : list.length >= 20
      );
      setPage(pageNum);
    } catch {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
      loadingRef.current = false;
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (res?.success && isMounted.current) {
        setUnreadCount(res.data?.count || 0);
        DeviceEventEmitter.emit('notification_badge_updated', {
          count: res.data?.count || 0,
        });
      }
    } catch {}
  }, []);

  /* ================= ACTIONS ================= */

  const handleOpen = async (item) => {
    if (item.is_read === false || item.isRead === false) {
      setNotifications(prev =>
        prev.map(n =>
          n._id === item._id ? { ...n, is_read: true } : n
        )
      );
      await markNotificationAsRead(item._id);
      loadUnreadCount();
    }

    // Navigate based on notification type or data
    const notificationType = item.type || item.notificationType || '';
    const propertyId = item.propertyId || item.data?.propertyId;
    
    if (propertyId) {
      // Navigate to property details if notification is about a property
      navigation.navigate('PropertyDetailsScreen', { propertyId });
      return;
    }
    
    if (notificationType.toLowerCase().includes('chat') || notificationType.toLowerCase().includes('message')) {
      // Navigate to chat if it's a message notification
      const chatId = item.chatId || item.data?.chatId;
      const userId = item.senderId || item.data?.senderId;
      if (chatId || userId) {
        navigation.navigate('ChatDetailScreen', { chatId, user: { _id: userId } });
        return;
      }
    }
    
    // Default: Show alert with notification content
    Alert.alert(item.title || 'Notification', item.body || '');
  };

  const handleDelete = (item) => {
    Alert.alert('Delete', 'Delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setNotifications(prev =>
            prev.filter(n => n._id !== item._id)
          );
          await deleteNotification(item._id);
          loadUnreadCount();
        },
      },
    ]);
  };

  /* ================= HELPERS ================= */

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diff < 1) return 'Now';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return new Date(ts).toLocaleDateString();
  };

  /* ================= EFFECTS (ALL HOOKS TOP LEVEL) ================= */

  useEffect(() => {
    loadNotifications(1);
    loadUnreadCount();
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications(1);
      loadUnreadCount();
    }, [])
  );

  /* ================= RENDER ITEM ================= */

  const renderItem = ({ item }) => {
    const unread = item.is_read === false || item.isRead === false;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleOpen(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.avatar}>
          <Icon name="notifications" size={22} color="#fff" />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              numberOfLines={1}
              style={[styles.title, unread && styles.bold]}
            >
              {item.title || 'Notification'}
            </Text>
            <Text style={styles.time}>
              {formatTime(item.created_at)}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            style={[styles.message, unread && styles.bold]}
          >
            {item.body || item.message || ''}
          </Text>
        </View>

        {unread && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>

        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* BODY */}
      {loading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2979FF" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications(1);
              }}
            />
          }
          onEndReached={() =>
            hasMore && !loadingMore && loadNotifications(page + 1)
          }
          onEndReachedThreshold={0.4}
        />
      )}
    </View>
  );
};

export default NotificationListScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },

  badge: {
    backgroundColor: '#2979FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F8EF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  content: { flex: 1 },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    marginRight: 8,
  },

  message: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  bold: {
    fontWeight: '700',
    color: '#000',
  },

  time: {
    fontSize: 12,
    color: '#999',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2979FF',
    marginLeft: 8,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
