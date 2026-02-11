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
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

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

      // Filter out duplicates based on _id
      setNotifications(prev => {
        const combined = pageNum === 1 ? list : [...prev, ...list];
        const uniqueList = combined.filter((item, index, self) => 
          index === self.findIndex(t => t._id === item._id)
        );
        return uniqueList;
      });

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
    
    // Default: Show styled modal with title and message
    const title = item.title || 'Notification';
    const message = item.body || item.message || 'No message';
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  // Handle modal close and refresh notifications
  const handleCloseModal = () => {
    setModalVisible(false);
    // Refresh notifications to update read status and unread count
    loadNotifications(1);
    loadUnreadCount();
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
        style={[styles.row, unread && styles.rowUnread]}
        onPress={() => handleOpen(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
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
            numberOfLines={2}
            style={[styles.message, unread && styles.bold]}
          >
            {item.body || item.message || ''}
          </Text>
        </View>

        {unread && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  /* ================= EMPTY STATE ================= */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="notifications-off-outline" size={48} color="#CCCCCC" style={styles.emptyIcon} />
      <Text style={styles.emptyText}>No Notifications</Text>
      <Text style={styles.emptySubText}>
        You don't have any notifications yet
      </Text>
    </View>
  );

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" translucent={false} />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>

        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* BODY */}
      {loading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FDB022" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => `${item._id || item.id || 'notif'}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && { flex: 1 }
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications(1);
              }}
              colors={['#FDB022']}
              tintColor="#FDB022"
            />
          }
          onEndReached={() =>
            hasMore && !loadingMore && loadNotifications(page + 1)
          }
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator 
                size="small" 
                color="#FDB022" 
                style={{ paddingVertical: 16 }} 
              />
            ) : null
          }
        />
      )}

      {/* ============ STYLED NOTIFICATION MODAL ============ */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCloseModal}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleCloseModal}
            >
              <Icon name="close-circle" size={28} color="#FDB022" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.modalTitle}>{modalTitle}</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>{modalMessage}</Text>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleCloseModal}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default NotificationListScreen;

/* ================= COLORS ================= */
const COLORS = {
  primary: '#FDB022',
  background: '#FFFFFF',
  white: '#FFFFFF',
  text: '#222222',
  textSecondary: '#666666',
  border: '#EEEEEE',
  unreadBg: '#FFF8E7',
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 14,
    flex: 1,
    color: COLORS.text,
  },

  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },

  badgeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  rowUnread: {
    backgroundColor: COLORS.unreadBg,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  content: { 
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },

  title: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },

  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  bold: {
    fontWeight: '600',
  },

  time: {
    fontSize: 12,
    color: '#999999',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyIcon: {
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },

  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  listContent: {
    paddingBottom: 16,
  },

  /* ============ MODAL STYLES ============ */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 360,
  },

  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },

  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },

  modalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});
