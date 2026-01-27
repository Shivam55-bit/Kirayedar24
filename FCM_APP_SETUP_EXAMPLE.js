/**
 * FCM Initialization in App.js
 * 
 * Add this code to your main App.js file
 * This sets up all FCM handlers at app startup
 */

import { useEffect } from 'react';
import { initializeFCM, getInitialNotification } from './src/utils/fcmService';

export default function App() {
  useEffect(() => {
    initializeFCM({
      // Handle notifications received in foreground
      onForegroundNotification: (remoteMessage) => {
        console.log('Foreground notification:', remoteMessage.notification?.title);
        // Update UI, show toast, etc.
      },
      
      // Handle notifications when app transitions from background to foreground
      onNotificationOpened: async (remoteMessage) => {
        console.log('Notification opened:', remoteMessage.notification?.title);
        
        // Deep linking example
        const data = remoteMessage.data || {};
        if (data.screen) {
          // Navigate to specific screen
          // navigation.navigate(data.screen, { propertyId: data.propertyId });
        }
      },
      
      // Handle token refresh
      onTokenRefresh: (newToken) => {
        console.log('New FCM token:', newToken);
        // Send to backend
      },
    });
    
    // Handle notification that opened the app from killed state
    getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from killed state by notification');
        const data = remoteMessage.data || {};
        if (data.screen) {
          // Navigate to specific screen
          // navigation.navigate(data.screen);
        }
      }
    });
  }, []);

  return (
    <>
      {/* Your app components go here */}
    </>
  );
}
