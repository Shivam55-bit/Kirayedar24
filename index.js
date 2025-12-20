/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// Only import Firebase messaging for mobile platforms
if (Platform.OS !== 'web') {
  const messaging = require('@react-native-firebase/messaging').default;
  
  // Register background handler for FCM
  // This MUST be done at the top level, not inside a component
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('📩 Background Message received in index.js:', remoteMessage);
    
    // Save notification to local storage for when app opens
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      if (remoteMessage && remoteMessage.notification) {
        // Get existing notifications
        const existingData = await AsyncStorage.getItem('app_notifications');
        const existingNotifications = existingData ? JSON.parse(existingData) : [];
        
        // Create new notification
        const newNotification = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: remoteMessage.data?.type || 'system',
          title: remoteMessage.notification.title,
          message: remoteMessage.notification.body,
          propertyId: remoteMessage.data?.propertyId,
          chatId: remoteMessage.data?.chatId,
          inquiryId: remoteMessage.data?.inquiryId,
          image: remoteMessage.data?.image,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        // Add to beginning of array
        const updatedNotifications = [newNotification, ...existingNotifications].slice(0, 50);
        
        // Save updated notifications
        await AsyncStorage.setItem('app_notifications', JSON.stringify(updatedNotifications));
        
        // Update notification count
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        await AsyncStorage.setItem('notification_count', unreadCount.toString());
        
        console.log('✅ Background notification saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving background notification:', error);
    }
  });
}

// Register the main App component
AppRegistry.registerComponent(appName, () => App);
