/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notification setup, token management, and foreground notifications
 */

import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// Storage key for FCM token
const FCM_TOKEN_KEY = '@fcm_token';

/**
 * Request notification permission from the user
 * Required for iOS and Android 13+
 * @returns {Promise<boolean>} true if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Notification permission granted:', authStatus);
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token and store it in AsyncStorage
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const getFCMToken = async () => {
  try {
    // Check if user has granted permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('⚠️ Cannot get FCM token: Permission not granted');
      return null;
    }

    // Get FCM token
    const token = await messaging().getToken();
    
    if (token) {
      console.log('✅ FCM Token retrieved:', token);
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      console.log('💾 FCM Token saved to AsyncStorage');
      
      return token;
    } else {
      console.log('⚠️ No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

/**
 * Get stored FCM token from AsyncStorage
 * @returns {Promise<string|null>} Stored FCM token or null
 */
export const getStoredFCMToken = async () => {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ Error getting stored FCM token:', error);
    return null;
  }
};

/**
 * Setup foreground notification handler
 * Shows alert when notification is received while app is in foreground
 */
export const setupForegroundNotificationHandler = () => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('📩 🔥 FOREGROUND notification received:', JSON.stringify(remoteMessage, null, 2));

    // IMMEDIATELY show alert - don't wait for anything
    const { title, body } = remoteMessage.notification || {};
    const data = remoteMessage.data || {};

    // Show alert IMMEDIATELY for foreground notification
    if (title || body) {
      console.log('🚨 SHOWING FOREGROUND ALERT:', { title, body });
      
      Alert.alert(
        title || '🔔 नई सूचना',
        body || 'आपके लिए एक नया मैसेज है',
        [
          {
            text: 'बंद करें',
            style: 'cancel',
            onPress: () => console.log('Notification dismissed')
          },
          {
            text: 'देखें',
            onPress: () => {
              console.log('User tapped View on notification:', data);
              // TODO: Add navigation logic here based on notification data
              // This should navigate to appropriate screen based on data.type
            },
          },
        ],
        { 
          cancelable: true,
          userInterfaceStyle: 'light' // Ensure visibility
        }
      );
    } else {
      console.log('⚠️ No title/body in foreground notification');
    }

    // Save notification to local storage (secondary action)
    try {
      const { addNotification } = await import('./notificationManager');
      
      if (remoteMessage && remoteMessage.notification) {
        const notification = {
          type: remoteMessage.data?.type || 'system',
          title: remoteMessage.notification.title,
          message: remoteMessage.notification.body,
          propertyId: remoteMessage.data?.propertyId,
          chatId: remoteMessage.data?.chatId,
          inquiryId: remoteMessage.data?.inquiryId,
          image: remoteMessage.data?.image
        };
        
        await addNotification(notification);
        console.log('✅ Foreground notification saved to local storage');
      }
    } catch (error) {
      console.error('❌ Error saving foreground notification:', error);
    }
  });

  // Return unsubscribe function to cleanup when component unmounts
  return unsubscribe;
};

/**
 * Setup background notification handler
 * Handles notifications when app is in background or quit state
 */
export const setupBackgroundNotificationHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('📩 Background notification received:', JSON.stringify(remoteMessage, null, 2));
    
    // Save notification to local storage even when app is killed
    try {
      const { addNotification } = await import('./notificationManager');
      
      if (remoteMessage && remoteMessage.notification) {
        const notification = {
          type: remoteMessage.data?.type || 'system',
          title: remoteMessage.notification.title,
          message: remoteMessage.notification.body,
          propertyId: remoteMessage.data?.propertyId,
          chatId: remoteMessage.data?.chatId,
          inquiryId: remoteMessage.data?.inquiryId,
          image: remoteMessage.data?.image
        };
        
        await addNotification(notification);
        console.log('✅ Background notification saved to local storage');
      }
    } catch (error) {
      console.error('❌ Error saving background notification:', error);
    }
    
    // The notification will be automatically displayed by the system
  });
};

/**
 * Listen for FCM token refresh
 * Token can refresh when app is restored, reinstalled, or user clears data
 */
export const setupTokenRefreshListener = (onTokenRefresh) => {
  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    console.log('🔄 FCM Token refreshed:', token);
    
    // Store new token
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    console.log('💾 New FCM Token saved to AsyncStorage');
    
    // Call callback if provided (e.g., to send to backend)
    if (onTokenRefresh && typeof onTokenRefresh === 'function') {
      onTokenRefresh(token);
    }
  });

  return unsubscribe;
};

/**
 * Handle notification tap when app is in background/quit state
 * @param {Function} handler - Callback to handle notification data
 */
export const setupNotificationOpenedListener = (handler) => {
  // Notification opened when app is in background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('🔔 Notification opened (background):', remoteMessage);
    if (handler && typeof handler === 'function') {
      handler(remoteMessage);
    }
  });

  // Notification opened when app was quit
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('🔔 Notification opened (quit state):', remoteMessage);
        if (handler && typeof handler === 'function') {
          handler(remoteMessage);
        }
      }
    });
};

/**
 * Create default notification channel (Android only)
 * Required for Android 8.0+ to display notifications
 */
export const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    // Note: This requires @notifee/react-native package for advanced channel management
    // For basic FCM, the channel is created automatically when first notification arrives
    console.log('📱 Android notification channel will be created automatically');
  }
};

/**
 * Check if FCM is properly configured
 */
export const checkFCMConfiguration = async () => {
  try {
    console.log('🔍 Checking FCM configuration...');
    const results = {
      configured: false,
      details: {},
      errors: [],
      warnings: []
    };
    
    // Check if Firebase is initialized
    try {
      const app = messaging().app;
      console.log('✅ Firebase app initialized:', app.name);
      results.details.firebaseInit = true;
    } catch (firebaseError) {
      console.error('❌ Firebase initialization failed:', firebaseError);
      results.errors.push('Firebase not initialized: ' + firebaseError.message);
      results.details.firebaseInit = false;
      return { ...results, error: 'Firebase initialization failed' };
    }
    
    // Check permissions with better error handling
    try {
      const authStatus = await messaging().requestPermission();
      const hasPermission = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      results.details.permissions = {
        status: authStatus,
        granted: hasPermission
      };
      
      if (!hasPermission) {
        console.warn('⚠️ Notification permissions not granted, status:', authStatus);
        results.warnings.push(`Notification permissions not granted (status: ${authStatus})`);
        results.details.permissionWarning = true;
      } else {
        console.log('✅ Notification permissions granted');
      }
    } catch (permissionError) {
      console.error('❌ Permission check failed:', permissionError);
      results.errors.push('Permission check failed: ' + permissionError.message);
      results.details.permissions = { error: permissionError.message };
    }
    
    // Try to get token with retry logic
    let token = null;
    try {
      console.log('🎫 Attempting to get FCM token...');
      token = await messaging().getToken();
      
      if (!token) {
        console.warn('⚠️ FCM token is null - retrying...');
        // Retry once after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await messaging().getToken();
      }
      
      if (token) {
        console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
        results.details.token = {
          available: true,
          preview: token.substring(0, 20) + '...',
          length: token.length
        };
      } else {
        console.warn('⚠️ Unable to get FCM token after retry');
        results.warnings.push('FCM token not available - check Google Play Services and network');
        results.details.token = { available: false };
      }
    } catch (tokenError) {
      console.error('❌ Token generation failed:', tokenError);
      results.errors.push('Token generation failed: ' + tokenError.message);
      results.details.token = { error: tokenError.message };
    }
    
    // Check device capabilities
    try {
      const isGooglePlayServicesAvailable = await messaging().hasPermission();
      results.details.googlePlayServices = isGooglePlayServicesAvailable !== -1;
      
      if (!results.details.googlePlayServices) {
        results.warnings.push('Google Play Services may not be available');
      }
    } catch (playServicesError) {
      console.warn('⚠️ Could not check Google Play Services:', playServicesError);
      results.details.googlePlayServices = 'unknown';
    }
    
    // Determine overall configuration status
    const hasErrors = results.errors.length > 0;
    const hasToken = results.details.token?.available === true;
    const hasPermissions = results.details.permissions?.granted === true;
    
    if (!hasErrors && hasToken && hasPermissions) {
      results.configured = true;
      console.log('✅ FCM is fully configured and working');
    } else if (!hasErrors && (hasToken || hasPermissions)) {
      results.configured = 'partial';
      console.log('⚠️ FCM is partially configured');
    } else {
      results.configured = false;
      console.log('❌ FCM configuration has issues');
    }
    
    return { ...results, token };
    
  } catch (error) {
    console.error('❌ FCM configuration check failed:', error);
    return { 
      configured: false, 
      error: error.message,
      errors: [error.message],
      details: { generalError: true }
    };
  }
};

/**
 * Send FCM token to backend for storage
 */
export const sendTokenToBackend = async (userId, token) => {
  try {
    if (!userId || !token) {
      console.warn('⚠️ Missing userId or token for backend sync');
      return false;
    }
    
    console.log('📤 Sending FCM token to backend...');
    const { BASE_URL } = await import('../config/api.config');
    
    if (!BASE_URL) {
      console.warn('⚠️ BASE_URL not configured');
      return false;
    }
    
    // Use your existing API structure
    const response = await fetch(`${BASE_URL}/users/fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed
        // 'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        userId: userId,
        fcmToken: token,
        platform: Platform.OS,
        deviceInfo: {
          os: Platform.OS,
          version: Platform.Version
        }
      })
    });
    
    if (response.ok) {
      console.log('✅ FCM token sent to backend successfully');
      await AsyncStorage.setItem('fcm_token_synced', 'true');
      return true;
    } else {
      console.warn('⚠️ Failed to send FCM token to backend:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error sending FCM token to backend:', error);
    return false;
  }
};

/**
 * Initialize FCM service
 * Call this once when app starts
 * @param {Function} onTokenRefresh - Optional callback for token refresh
 * @param {Function} onNotificationOpened - Optional callback for notification opened
 * @returns {Object} Cleanup functions
 */
export const initializeFCM = async (onTokenRefresh, onNotificationOpened) => {
  console.log('🚀 Initializing FCM Service...');
  
  try {
    // First check if FCM is properly configured
    const configCheck = await checkFCMConfiguration();
    if (!configCheck.configured) {
      console.error('❌ FCM not properly configured:', configCheck.error);
      
      // Show user-friendly error
      Alert.alert(
        'Notification Setup',
        'Push notifications need to be enabled for the best experience. Please enable notifications in your device settings.',
        [{ text: 'OK' }]
      );
      
      return { token: null, cleanup: () => {} };
    }

    // Setup background handler (must be done outside component)
    setupBackgroundNotificationHandler();

    // Get FCM token
    const token = await getFCMToken();
    
    if (token) {
      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
      
      // Try to send token to backend
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          await sendTokenToBackend(userId, token);
        }
      } catch (syncError) {
        console.warn('⚠️ Token sync to backend failed (non-critical):', syncError.message);
      }
    }

    // Setup listeners
    const unsubscribeForeground = setupForegroundNotificationHandler();
    const unsubscribeTokenRefresh = setupTokenRefreshListener(async (newToken) => {
      console.log('🔄 FCM Token refreshed:', newToken.substring(0, 20) + '...');
      
      // Call user callback
      if (onTokenRefresh && typeof onTokenRefresh === 'function') {
        onTokenRefresh(newToken);
      }
      
      // Send updated token to backend
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          await sendTokenToBackend(userId, newToken);
        }
      } catch (syncError) {
        console.warn('⚠️ Updated token sync to backend failed:', syncError.message);
      }
    });
    
    setupNotificationOpenedListener(onNotificationOpened);

    console.log('✅ FCM Service initialized successfully');

    // Return cleanup function
    return {
      token,
      configured: true,
      cleanup: () => {
        if (unsubscribeForeground) unsubscribeForeground();
        if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
      },
    };
    
  } catch (error) {
    console.error('❌ FCM initialization failed:', error);
    
    Alert.alert(
      'Notification Error',
      'There was an issue setting up push notifications. Some features may not work properly.',
      [{ text: 'OK' }]
    );
    
    return { 
      token: null, 
      configured: false, 
      error: error.message,
      cleanup: () => {} 
    };
  }
};
