/**
 * Firebase Cloud Messaging (FCM) Service
 * Production-ready implementation with full support for:
 * - Foreground notifications (app is open)
 * - Background notifications (app minimized)
 * - Killed state notifications (app removed from recent)
 * - Deep linking to specific screens
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { sendFCMTokenToBackend } from '../services/api';

const FCM_TOKEN_KEY = '@fcm_token';
const TAG = '🔔 FCMService';

// ============================================================================
// NOTE: Background notifications are handled by Android FCMNotificationService
// This only handles foreground notifications when app is open
// Do NOT set setBackgroundMessageHandler here - Android handles it natively
// ============================================================================

// ============================================================================
// STEP 1: VERIFY FIREBASE IS CONFIGURED
// ============================================================================

/**
 * Check Firebase configuration status
 * Returns detailed diagnostics about FCM setup
 */
export const checkFCMConfiguration = async () => {
  try {
    console.log(`${TAG} 🔍 Checking FCM Configuration...`);
    
    const isEnabled = await messaging().isAutomaticInitEnabled();
    console.log(`${TAG} Auto-init enabled: ${isEnabled}`);
    
    const appId = await messaging().app.options.projectId;
    console.log(`${TAG} Project ID: ${appId}`);
    
    return {
      fcmConfigured: isEnabled,
      projectId: appId,
      status: isEnabled ? '✅ READY' : '❌ NOT READY'
    };
  } catch (error) {
    console.error(`${TAG} ❌ Configuration check failed:`, error);
    return {
      fcmConfigured: false,
      error: error.message,
      status: '❌ ERROR'
    };
  }
};

// ============================================================================
// STEP 1.5: CHECK FOR NATIVE TOKEN REFRESH (Android only)
// ============================================================================

/**
 * Check if Android native side has stored a refreshed FCM token
 * This happens when Firebase refreshes the token while the app was killed
 * The native FCMNotificationService stores it in SharedPreferences
 */
export const checkNativeTokenRefresh = async () => {
  if (Platform.OS !== 'android') {
    return null;
  }
  
  try {
    console.log(`${TAG} 🔍 Checking for native-stored refreshed token...`);
    
    // Try to read from SharedPreferences via RN bridge
    // Note: This requires the app to implement a native module or we use AsyncStorage
    // For now, we rely on the JS onTokenRefresh listener which fires when app opens
    
    // The native side stores the token, and when React Native initializes,
    // the @react-native-firebase/messaging library will detect the new token
    // and fire the onTokenRefresh event
    
    console.log(`${TAG} ℹ️ Native token refresh will be handled by onTokenRefresh listener`);
    return null;
  } catch (error) {
    console.error(`${TAG} ❌ Error checking native token refresh:`, error);
    return null;
  }
};

// ============================================================================
// STEP 2: REQUEST NOTIFICATION PERMISSION (Android 13+)
// ============================================================================

/**
 * Request user permission for notifications
 * Required on Android 13+ and iOS 10+
 */
export const requestNotificationPermission = async () => {
  try {
    console.log(`${TAG} 📲 Requesting notification permission...`);
    
    const authStatus = await messaging().requestPermission();
    const enabled = 
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log(`${TAG} ✅ Notification permission granted`);
      
      // Also request notifee permission for Android
      if (Platform.OS === 'android') {
        await notifee.requestPermission();
      }
      
      return true;
    } else {
      console.warn(`${TAG} ⚠️ Notification permission denied`);
      return false;
    }
  } catch (error) {
    console.error(`${TAG} ❌ Permission request failed:`, error);
    return false;
  }
};

// ============================================================================
// STEP 3: GET FCM TOKEN
// ============================================================================

/**
 * Get current FCM token
 * This token is used to send notifications to this specific device
 */
export const getFCMToken = async () => {
  try {
    console.log(`${TAG} 🔑 Getting FCM token...`);
    
    // Wait a bit for Firebase to initialize properly
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if Firebase is ready
    if (!messaging) {
      console.error(`${TAG} ❌ Firebase messaging not initialized`);
      return null;
    }
    
    const messagingInstance = messaging();
    if (!messagingInstance) {
      console.error(`${TAG} ❌ Firebase messaging instance not available`);
      return null;
    }
    
    const token = await messagingInstance.getToken();
    
    if (token) {
      console.log(`${TAG} ✅ FCM Token received: ${token.substring(0, 20)}...`);
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      await AsyncStorage.setItem('current_fcm_token', token);
      
      return token;
    } else {
      console.warn(`${TAG} ⚠️ No FCM token available`);
      return null;
    }
  } catch (error) {
    console.error(`${TAG} ❌ Failed to get FCM token:`, error.message);
    console.error(`${TAG} Error code:`, error.code);
    
    // Try alternative method - return stored token
    try {
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (storedToken) {
        console.log(`${TAG} ℹ️ Using stored FCM token from previous session`);
        return storedToken;
      }
    } catch (e) {
      console.error(`${TAG} ❌ Failed to get stored token:`, e);
    }
    
    return null;
  }
};

/**
 * Get stored FCM token from AsyncStorage
 */
export const getStoredFCMToken = async () => {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (token) {
      console.log(`${TAG} 📦 Retrieved stored FCM token`);
    }
    return token;
  } catch (error) {
    console.error(`${TAG} ❌ Failed to get stored token:`, error);
    return null;
  }
};

// ============================================================================
// STEP 4: INITIALIZE FCM WITH HANDLERS
// ============================================================================

/**
 * Initialize FCM with all necessary handlers
 * Call this from App.js or SplashScreen
 */
export const initializeFCM = async (callbacks = {}) => {
  try {
    console.log(`${TAG} 🚀 Initializing FCM...`);
    
    // Wait for Firebase to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Request permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn(`${TAG} ⚠️ Notification permission not granted`);
      return {
        configured: false,
        token: null,
        error: 'Notification permission denied',
        cleanup: () => {}
      };
    }
    
    // Create notification channel (Android)
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default_notification_channel',
        name: 'Default Notifications',
        importance: 4, // HIGH
        vibration: true,
        lightColor: '#FF6B6B',
      });
    }
    
    // Get token
    const token = await getFCMToken();
    
    // Check for any pending token syncs from previous sessions
    await checkPendingTokenSync();
    
    // CRITICAL: Sync token to backend on EVERY app open
    // This ensures backend always has the latest token
    if (token) {
      await syncTokenOnAppOpen(token);
    }
    
    // Listen for token refresh
    const tokenRefreshUnsubscribe = setupTokenRefreshListener(callbacks.onTokenRefresh);
    
    // Setup foreground notification handler
    const foregroundUnsubscribe = setupForegroundNotificationHandler(callbacks.onForegroundNotification);
    
    // Setup background notification handler
    setupBackgroundNotificationHandler(callbacks.onBackgroundNotification);
    
    // Setup notification opened handler (from killed/background state)
    const notificationOpenedUnsubscribe = setupNotificationOpenedHandler(callbacks.onNotificationOpened);
    
    console.log(`${TAG} ✅ FCM Initialized successfully`);
    
    return {
      configured: true,
      token: token,
      error: null,
      cleanup: () => {
        tokenRefreshUnsubscribe?.();
        foregroundUnsubscribe?.();
        notificationOpenedUnsubscribe?.();
      }
    };
  } catch (error) {
    console.error(`${TAG} ❌ FCM initialization failed:`, error);
    return {
      configured: false,
      token: null,
      error: error.message,
      cleanup: () => {}
    };
  }
};

// ============================================================================
// STEP 5: HANDLERS FOR DIFFERENT APP STATES
// ============================================================================

/**
 * Handle notifications received in FOREGROUND
 * App is open and visible to user
 * 
 * IMPORTANT: Foreground notifications are handled by Android FCMNotificationService.java
 * We only log here for debugging and call the callback for React-side handling
 * DO NOT call displayLocalNotification - it conflicts with native notifications
 */
const setupForegroundNotificationHandler = (callback) => {
  try {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log(`${TAG} 📬 Foreground notification received in React`);
      console.log(`${TAG} Title: ${remoteMessage.notification?.title}`);
      console.log(`${TAG} Body: ${remoteMessage.notification?.body}`);
      console.log(`${TAG} ℹ️ Native Android service is handling the notification display`);
      
      // Call custom callback for React-side handling (but don't display notification)
      if (callback) {
        callback(remoteMessage);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error(`${TAG} ❌ Error setting up foreground handler:`, error);
    return () => {};
  }
};

/**
 * Handle notifications when app is in BACKGROUND
 * App is minimized but still in memory
 * Firebase automatically displays notification from Notification Payload
 * This handler is for additional processing of data payload
 */
export const setupBackgroundNotificationHandler = (callback) => {
  try {
    // NOTE: For background state, if message has Notification Payload:
    // Firebase SDK automatically displays it - no code needed
    // 
    // If message has ONLY Data Payload:
    // Need to manually display using notifee in setBackgroundMessageHandler
    
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log(`${TAG} 🌙 Background Message Handler Called`);
      console.log(`${TAG} Title: ${remoteMessage.notification?.title}`);
      console.log(`${TAG} Body: ${remoteMessage.notification?.body}`);
      console.log(`${TAG} Has Notification: ${!!remoteMessage.notification}`);
      console.log(`${TAG} Has Data: ${remoteMessage.data?.size > 0}`);
      
      // If has notification payload, Firebase will show it automatically
      if (remoteMessage.notification) {
        console.log(`${TAG} ✅ Firebase will auto-display notification`);
      } 
      // If only has data payload, show it manually
      else if (remoteMessage.data) {
        console.log(`${TAG} 📦 Data-only message, displaying manually...`);
        const title = remoteMessage.data.title || 'Notification';
        const body = remoteMessage.data.body || '';
        
        if (title || body) {
          await notifee.displayNotification({
            title: title,
            body: body,
            android: {
              channelId: 'default_notification_channel',
              pressAction: {
                id: 'default',
                launchActivity: 'default',
              },
            },
          });
          console.log(`${TAG} ✅ Manual notification displayed`);
        }
      }
      
      // Call custom callback
      if (callback) {
        callback(remoteMessage);
      }
    });
    
    console.log(`${TAG} ✅ Background message handler registered`);
  } catch (error) {
    console.error(`${TAG} ❌ Error in background handler:`, error);
  }
};

/**
 * Handle notifications when app is KILLED
 * App is removed from recent tasks
 * Notification click opens the app
 */
const setupNotificationOpenedHandler = (callback) => {
  try {
    // Check if notification opened the app from killed state
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log(`${TAG} 💀 App opened from killed state by notification`);
        if (callback) {
          callback(remoteMessage);
        }
      }
    });
    
    // Listen for notification opened from background state
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(`${TAG} 🔗 Notification opened from background`);
      if (callback) {
        callback(remoteMessage);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error(`${TAG} ❌ Error setting up notification opened handler:`, error);
    return () => {};
  }
};

/**
 * Handle FCM token refresh
 * New token generated when user clears app data, installs update, etc.
 * CRITICAL: This must send the new token to backend to keep admin notifications working!
 */
const setupTokenRefreshListener = (callback) => {
  try {
    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log(`${TAG} 🔄 FCM Token refreshed - SYNCING TO BACKEND...`);
      console.log(`${TAG} 📝 New token (first 30 chars): ${token.substring(0, 30)}...`);
      
      // Store locally first
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      await AsyncStorage.setItem('current_fcm_token', token);
      
      // CRITICAL: Send refreshed token to backend immediately
      await syncRefreshedTokenToBackend(token);
      
      // Call custom callback if provided
      if (callback) {
        callback(token);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error(`${TAG} ❌ Error setting up token refresh listener:`, error);
    return () => {};
  }
};

/**
 * Sync refreshed FCM token to backend
 * Called when Firebase generates a new token (reinstall, update, refresh)
 * This is CRITICAL for admin broadcast notifications to work!
 */
const syncRefreshedTokenToBackend = async (token) => {
  try {
    console.log(`${TAG} 📤 Syncing refreshed FCM token to backend...`);
    
    // Get current user ID from storage
    const userId = await AsyncStorage.getItem('userId');
    
    if (!userId) {
      console.warn(`${TAG} ⚠️ No userId found - user not logged in. Token will sync on next login.`);
      // Store flag so we can sync on next login
      await AsyncStorage.setItem('fcm_token_pending_sync', 'true');
      return;
    }
    
    // Send to backend
    const response = await sendFCMTokenToBackend(userId, token);
    
    if (response && response.success) {
      console.log(`${TAG} ✅ FCM token synced to backend successfully!`);
      await AsyncStorage.setItem('fcm_token_pending_sync', 'false');
      await AsyncStorage.setItem('fcm_token_last_sync', new Date().toISOString());
    } else {
      console.error(`${TAG} ❌ Failed to sync FCM token:`, response?.message || 'Unknown error');
      // Mark for retry
      await AsyncStorage.setItem('fcm_token_pending_sync', 'true');
    }
  } catch (error) {
    console.error(`${TAG} ❌ Error syncing FCM token to backend:`, error);
    // Mark for retry on next app open
    await AsyncStorage.setItem('fcm_token_pending_sync', 'true');
  }
};

/**
 * Sync FCM token to backend on every app open
 * This ensures backend ALWAYS has the latest token
 * CRITICAL for admin broadcast notifications to work!
 */
const syncTokenOnAppOpen = async (token) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    
    if (!userId) {
      console.log(`${TAG} ℹ️ User not logged in, skipping token sync on app open`);
      return;
    }
    
    // Check last sync time - only sync if more than 1 hour ago
    const lastSync = await AsyncStorage.getItem('fcm_token_last_sync');
    if (lastSync) {
      const lastSyncTime = new Date(lastSync).getTime();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      if (lastSyncTime > oneHourAgo) {
        console.log(`${TAG} ℹ️ Token synced recently, skipping...`);
        return;
      }
    }
    
    console.log(`${TAG} 🔄 Syncing FCM token on app open...`);
    
    const response = await sendFCMTokenToBackend(userId, token);
    
    if (response && response.success) {
      console.log(`${TAG} ✅ FCM token synced on app open!`);
      await AsyncStorage.setItem('fcm_token_last_sync', new Date().toISOString());
    } else {
      console.warn(`${TAG} ⚠️ Token sync on app open failed:`, response?.message);
    }
  } catch (error) {
    console.warn(`${TAG} ⚠️ Error syncing token on app open:`, error.message);
  }
};

/**
 * Check if there's a pending FCM token sync and retry if needed
 * Call this on app startup and after login
 */
export const checkPendingTokenSync = async () => {
  try {
    const pendingSync = await AsyncStorage.getItem('fcm_token_pending_sync');
    
    if (pendingSync === 'true') {
      console.log(`${TAG} 🔄 Found pending FCM token sync, retrying...`);
      const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (token) {
        await syncRefreshedTokenToBackend(token);
      }
    }
  } catch (error) {
    console.error(`${TAG} ❌ Error checking pending token sync:`, error);
  }
};

// ============================================================================
// STEP 6: DISPLAY NOTIFICATION
// ============================================================================

/**
 * Display local notification using Notifee
 * Works in foreground, background, and killed states
 */
export const displayLocalNotification = async (title, body, data = {}) => {
  try {
    console.log(`${TAG} 📢 Displaying FCM notification: ${title}`);
    
    const androidConfig = {
      channelId: 'default_notification_channel',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    };
    
    // Add deep link data if present
    if (data?.screen) {
      androidConfig.pressAction.launchActivity = data.screen;
    }
    
    await notifee.displayNotification({
      title: `🔥 [FCM] ${title}`, // FCM prefix to distinguish from local
      body: body,
      android: androidConfig,
      ios: {
        sound: 'default',
        critical: false,
      },
      data: {
        ...data,
        source: 'fcm' // Mark as FCM notification
      },
    });
    
    console.log(`${TAG} ✅ FCM Notification displayed successfully`);
  } catch (error) {
    console.error(`${TAG} ❌ Failed to display FCM notification:`, error);
  }
};

// ============================================================================
// STEP 7: HELPER FUNCTIONS
// ============================================================================

/**
 * Get initial notification that opened the app
 * Use this in App.js to handle deep linking
 */
export const getInitialNotification = async () => {
  try {
    const notification = await messaging().getInitialNotification();
    if (notification) {
      console.log(`${TAG} 💀 Got initial notification from killed state`);
      return notification;
    }
    return null;
  } catch (error) {
    console.error(`${TAG} ❌ Error getting initial notification:`, error);
    return null;
  }
};

/**
 * Listen for notification opened from background
 */
export const onNotificationOpenedApp = (callback) => {
  try {
    return messaging().onNotificationOpenedApp((notification) => {
      console.log(`${TAG} 🔗 Notification opened from background`);
      callback(notification);
    });
  } catch (error) {
    console.error(`${TAG} ❌ Error setting up notification opened listener:`, error);
    return () => {};
  }
};

/**
 * Legacy token refresh listener
 */
export const onTokenRefresh = (callback) => {
  try {
    return messaging().onTokenRefresh((token) => {
      console.log(`${TAG} 🔄 Token refreshed`);
      callback(token);
    });
  } catch (error) {
    console.error(`${TAG} ❌ Error setting up token refresh:`, error);
    return () => {};
  }
};

/**
 * Create notification channel (Android)
 */
export const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default_notification_channel',
      name: 'Default Notifications',
      importance: 4,
      vibration: true,
    });
  }
};

export default {
  checkFCMConfiguration,
  requestNotificationPermission,
  getFCMToken,
  getStoredFCMToken,
  initializeFCM,
  setupBackgroundNotificationHandler,
  displayLocalNotification,
  getInitialNotification,
  onNotificationOpenedApp,
  onTokenRefresh,
  createNotificationChannel,
  checkPendingTokenSync,
  syncRefreshedTokenToBackend,
};
