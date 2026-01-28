import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Platform, AppState } from 'react-native';
import { getNotifications, markNotificationAsRead } from './notificationapi';

let notifee = null;
let AndroidStyle = null;
let AndroidImportance = null;
let AndroidCategory = null;
let AndroidVisibility = null;

// Initialize notifee dynamically (to avoid web issues)
const initNotifee = async () => {
  if (Platform.OS === 'web') return null;
  
  try {
    const notifeeModule = await import('@notifee/react-native');
    notifee = notifeeModule.default;
    AndroidStyle = notifeeModule.AndroidStyle;
    AndroidImportance = notifeeModule.AndroidImportance;
    AndroidCategory = notifeeModule.AndroidCategory;
    AndroidVisibility = notifeeModule.AndroidVisibility;
    
    // Create notification channel for Android - High priority channel (like 99acres/YouTube)
    if (Platform.OS === 'android') {
      // Main notifications channel
      await notifee.createChannel({
        id: 'kirayedar24_notifications',
        name: 'Kirayedar24 Notifications',
        description: 'Property updates, messages and alerts',
        sound: 'default',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [300, 500],
        lights: true,
        lightColor: '#FDB022',
        badge: true,
        visibility: AndroidVisibility?.PUBLIC || 1,
      });
      
      // Chat messages channel (high priority)
      await notifee.createChannel({
        id: 'kirayedar24_chat',
        name: 'Chat Messages',
        description: 'New messages from property owners and tenants',
        sound: 'default',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [100, 200, 100, 200],
        lights: true,
        lightColor: '#4CAF50',
        badge: true,
      });
      
      // Property alerts channel
      await notifee.createChannel({
        id: 'kirayedar24_property',
        name: 'Property Alerts',
        description: 'New properties and listing updates',
        sound: 'default',
        importance: AndroidImportance.DEFAULT,
        vibration: true,
        lights: true,
        lightColor: '#2196F3',
        badge: true,
      });
    }
    
    // Setup notification event handlers
    setupNotificationHandlers();
    
    return notifee;
  } catch (error) {
    console.warn('⚠️ Notifee not available:', error.message);
    return null;
  }
};

// Handle notification actions (Mark as read, Delete)
const setupNotificationHandlers = () => {
  if (!notifee) return;
  
  // Handle foreground events
  notifee.onForegroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    
    if (pressAction?.id === 'mark_read') {
      // Mark notification as read
      const notifId = notification?.data?.notificationId;
      if (notifId) {
        try {
          await markNotificationAsRead(notifId);
          DeviceEventEmitter.emit('notificationMarkedRead', notifId);
          fetchAndProcessNotifications(false);
        } catch (e) {
          console.log('Error marking as read:', e);
        }
      }
      // Cancel the notification
      await notifee.cancelNotification(notification.id);
    } else if (pressAction?.id === 'dismiss') {
      // Just dismiss the notification
      await notifee.cancelNotification(notification.id);
    }
  });
  
  // Handle background events
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    
    if (pressAction?.id === 'mark_read') {
      const notifId = notification?.data?.notificationId;
      if (notifId) {
        try {
          await markNotificationAsRead(notifId);
        } catch (e) {
          console.log('Error marking as read:', e);
        }
      }
      await notifee.cancelNotification(notification.id);
    } else if (pressAction?.id === 'dismiss') {
      await notifee.cancelNotification(notification.id);
    }
  });
};

// Get notification icon emoji based on type
const getNotificationIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'property':
    case 'listing':
      return '🏠';
    case 'message':
    case 'chat':
      return '💬';
    case 'payment':
    case 'subscription':
      return '💳';
    case 'enquiry':
      return '📩';
    case 'appointment':
      return '📅';
    case 'alert':
    case 'warning':
      return '⚠️';
    case 'success':
      return '✅';
    default:
      return '🔔';
  }
};

// Get channel ID based on notification type
const getChannelId = (type) => {
  switch (type?.toLowerCase()) {
    case 'message':
    case 'chat':
      return 'kirayedar24_chat';
    case 'property':
    case 'listing':
    case 'enquiry':
      return 'kirayedar24_property';
    default:
      return 'kirayedar24_notifications';
  }
};

// Display a local push notification (99acres/YouTube style - Rich notifications)
const displayLocalNotification = async (notification) => {
  if (!notifee) {
    notifee = await initNotifee();
  }
  
  if (!notifee) return;
  
  try {
    const icon = getNotificationIcon(notification.type);
    const title = notification.title || 'Kirayedar24';
    const body = notification.message || notification.body || '';
    const timestamp = notification.createdAt ? new Date(notification.createdAt).getTime() : Date.now();
    const channelId = getChannelId(notification.type);
    const notificationType = notification.type?.toLowerCase() || 'system';
    
    // Format timestamp for subtitle (like "Now", "5 min ago", etc.)
    const getTimeAgo = (ts) => {
      const diff = Date.now() - ts;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Now';
      if (minutes < 60) return `${minutes} min ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return new Date(ts).toLocaleDateString();
    };
    
    await notifee.displayNotification({
      // Title without emoji - cleaner look like 99acres
      title: title,
      // Subtitle shows app name and time (like 99acres)
      subtitle: `Kirayedar24 • ${getTimeAgo(timestamp)}`,
      body: body,
      android: {
        channelId: channelId,
        // Small icon in status bar (white/monochrome icon)
        smallIcon: 'ic_notification', // You need this icon in android/app/src/main/res/drawable
        // Large icon (app icon) shown on right side like 99acres
        largeIcon: 'ic_launcher',
        // Brand color for notification accent
        color: '#FDB022',
        // Circle crop for large icon (looks better)
        circularLargeIcon: true,
        // Press action to open app
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        importance: AndroidImportance?.HIGH || 4,
        // Big text style for expandable notification (like 99acres expanded view)
        style: {
          type: AndroidStyle?.BIGTEXT || 1,
          text: body,
        },
        // Show timestamp
        showTimestamp: true,
        timestamp: timestamp,
        // Chrome-style notification with time
        showChronometer: false,
        // Group notifications by type
        groupId: `kirayedar24_${notificationType}`,
        groupSummary: false,
        // Category for notification behavior
        category: notificationType === 'chat' ? (AndroidCategory?.MESSAGE || 'msg') : (AndroidCategory?.SOCIAL || 'social'),
        // Visibility on lock screen
        visibility: AndroidVisibility?.PUBLIC || 1,
        // Auto cancel when tapped
        autoCancel: true,
        // Only alert once for same notification
        onlyAlertOnce: true,
        // Badge count
        badgeCount: 1,
        // Heads-up notification (popup at top)
        fullScreenAction: undefined,
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
        // Thread ID for grouping (like 99acres)
        threadId: `kirayedar24_${notificationType}`,
      },
      data: {
        notificationId: notification._id || notification.id,
        type: notification.type || 'system',
        referenceId: notification.referenceId || '',
      },
    });
    
    console.log('✅ Rich notification displayed:', title);
  } catch (error) {
    console.error('❌ Error displaying notification:', error);
  }
};

// Display grouped notifications summary (Inbox style like Gmail/99acres)
const displayGroupedNotification = async (notifications) => {
  if (!notifee || notifications.length === 0) return;
  
  try {
    const count = notifications.length;
    const titles = notifications.slice(0, 5).map(n => n.title || 'New notification');
    
    await notifee.displayNotification({
      title: `${count} new notifications`,
      subtitle: 'Kirayedar24',
      body: titles[0] + (count > 1 ? ` and ${count - 1} more` : ''),
      android: {
        channelId: 'kirayedar24_notifications',
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        circularLargeIcon: true,
        color: '#FDB022',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        importance: AndroidImportance?.HIGH || 4,
        // Inbox style shows multiple lines when expanded (like Gmail)
        style: {
          type: AndroidStyle?.INBOX || 2,
          lines: titles,
        },
        groupSummary: true,
        groupId: 'kirayedar24_notifications',
        autoCancel: true,
        showTimestamp: true,
        timestamp: Date.now(),
        badgeCount: count,
      },
      data: {
        type: 'grouped',
        count: count,
      },
    });
  } catch (error) {
    console.error('❌ Error displaying grouped notification:', error);
  }
};

// Get the last synced notification ID
const getLastSyncedId = async () => {
  try {
    return await AsyncStorage.getItem('last_synced_notification_id');
  } catch {
    return null;
  }
};

// Set the last synced notification ID
const setLastSyncedId = async (id) => {
  try {
    await AsyncStorage.setItem('last_synced_notification_id', id);
  } catch (error) {
    console.error('Error saving last synced ID:', error);
  }
};

// Fetch and process new notifications from API
export const fetchAndProcessNotifications = async (showPushNotification = true) => {
  try {
    console.log('🔄 Fetching notifications from API...');
    
    const response = await getNotifications();
    
    if (!response.success || !response.data) {
      console.warn('⚠️ No notifications from API');
      return { count: 0, newNotifications: [] };
    }
    
    const notifications = response.data || [];
    const lastSyncedId = await getLastSyncedId();
    
    // Filter only unread notifications
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const unreadCount = unreadNotifications.length;
    
    // Find new notifications (ones we haven't shown push for)
    let newNotifications = [];
    if (lastSyncedId) {
      const lastSyncedIndex = notifications.findIndex(n => n._id === lastSyncedId);
      if (lastSyncedIndex > 0) {
        newNotifications = notifications.slice(0, lastSyncedIndex);
      } else if (lastSyncedIndex === -1) {
        // Last synced notification not found, consider all as potentially new
        newNotifications = notifications.slice(0, 5); // Limit to avoid spam
      }
    } else {
      // First time sync - don't spam with old notifications
      newNotifications = [];
    }
    
    // Show push notifications for new ones
    if (showPushNotification && newNotifications.length > 0) {
      const appState = AppState.currentState;
      console.log(`📱 App state: ${appState}, showing ${Math.min(newNotifications.length, 3)} notifications`);
      
      // Show heads-up notification regardless of app state
      for (const notification of newNotifications.slice(0, 3)) { // Limit to 3
        await displayLocalNotification(notification);
      }
    }
    
    // Update last synced ID
    if (notifications.length > 0) {
      await setLastSyncedId(notifications[0]._id);
    }
    
    // Save count to AsyncStorage
    await AsyncStorage.setItem('notification_count', unreadCount.toString());
    
    // Emit event to update UI
    DeviceEventEmitter.emit('notificationCountUpdated', unreadCount);
    
    console.log(`✅ Notifications fetched: ${notifications.length} total, ${unreadCount} unread, ${newNotifications.length} new`);
    
    return {
      count: unreadCount,
      total: notifications.length,
      newNotifications: newNotifications,
    };
    
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return { count: 0, newNotifications: [] };
  }
};

// Start background polling for notifications
let pollingInterval = null;

export const startNotificationPolling = (intervalMs = 60000) => {
  // Stop existing polling if any
  stopNotificationPolling();
  
  console.log(`🔄 Starting notification polling every ${intervalMs / 1000}s`);
  
  // Fetch immediately
  fetchAndProcessNotifications(true);
  
  // Then poll at interval
  pollingInterval = setInterval(() => {
    fetchAndProcessNotifications(true);
  }, intervalMs);
};

export const stopNotificationPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⏹️ Notification polling stopped');
  }
};

// Get current notification count from storage
export const getStoredNotificationCount = async () => {
  try {
    const count = await AsyncStorage.getItem('notification_count');
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
};

// Initialize the service
export const initBackgroundNotificationService = async () => {
  await initNotifee();
  
  // Listen for app state changes
  const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // App came to foreground - fetch latest notifications
      fetchAndProcessNotifications(false);
    }
  });
  
  // Start polling
  startNotificationPolling(60000); // Every 60 seconds
  
  return () => {
    stopNotificationPolling();
    appStateSubscription.remove();
  };
};

export default {
  initBackgroundNotificationService,
  fetchAndProcessNotifications,
  startNotificationPolling,
  stopNotificationPolling,
  getStoredNotificationCount,
  displayLocalNotification,
  displayGroupedNotification,
};
