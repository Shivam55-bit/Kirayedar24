import React, { useEffect, useRef } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeFCM } from './src/utils/fcmService';
import { Alert } from 'react-native';
import { DeviceEventEmitter } from 'react-native';

// Import FCM debug helper in development mode
if (__DEV__) {
  import('./src/utils/fcmDebugHelper');
}

const App = () => {
  const navigationRef = useRef();

  useEffect(() => {
    let fcmCleanup = null;

    // Initialize Firebase Cloud Messaging
    const setupFCM = async () => {
      try {
        console.log('🚀 Starting FCM setup in App.js...');
        
        const result = await initializeFCM(
          // Callback for token refresh
          async (newToken) => {
            console.log('🔄 FCM Token refreshed in App.js:', newToken?.substring(0, 20) + '...');
            
            // Send updated token to backend
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const userId = await AsyncStorage.getItem('userId');
              
              if (userId && newToken) {
                // You can add your backend token update API call here
                console.log('📤 Should send updated FCM token to backend for user:', userId);
                // await sendTokenToBackend(userId, newToken);
              }
            } catch (syncError) {
              console.warn('⚠️ Token sync failed (non-critical):', syncError.message);
            }
          },
          
          // Callback for notification opened
          (notification) => {
            console.log('🔔 Notification opened in App.js:', notification);
            
            try {
              // Add notification to local storage for display in notification list
              const { addNotification } = require('./src/utils/notificationManager');
              if (notification && notification.notification) {
                addNotification({
                  type: notification.data?.type || 'system',
                  title: notification.notification.title,
                  message: notification.notification.body,
                  propertyId: notification.data?.propertyId,
                  chatId: notification.data?.chatId,
                  inquiryId: notification.data?.inquiryId,
                  image: notification.data?.image
                });
              }
              
              // Use notification service to handle navigation
              if (navigationRef.current) {
                // const { handleNotificationAction } = require('./src/services/notificationService');
                handleNotificationAction(notification.data || notification, navigationRef.current);
              }
            } catch (notificationError) {
              console.error('❌ Error handling opened notification:', notificationError);
            }
          }
        );

        if (result.configured && result.token) {
          console.log('✅ FCM initialized successfully with token:', result.token.substring(0, 20) + '...');
          
          // Store token locally for debugging
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('current_fcm_token', result.token);
          
        } else if (!result.configured) {
          console.warn('⚠️ FCM not properly configured:', result.error);
        } else {
          console.warn('⚠️ FCM configured but no token received');
        }

        fcmCleanup = result.cleanup;
        
      } catch (error) {
        console.error('❌ Error initializing FCM in App.js:', error);
        
        // In development, show detailed error
        if (__DEV__) {
          setTimeout(() => {
            Alert.alert(
              'FCM Setup Error',
              `Firebase Cloud Messaging setup failed: ${error.message}`,
              [{ text: 'OK' }]
            );
          }, 2000);
        }
      }
    };

    setupFCM();

    // Cleanup on unmount
    return () => {
      if (fcmCleanup) {
        fcmCleanup();
      }
    };
  }, []);

  return <AppNavigator ref={navigationRef} />;
};

export default App;
