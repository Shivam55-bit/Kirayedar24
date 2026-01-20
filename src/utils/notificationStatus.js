/**
 * Quick notification status - TEMPORARILY DISABLED
 */

// import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export const showQuickNotificationStatus = async () => {
  Alert.alert('FCM Disabled', 'FCM is temporarily disabled');
  return null;
};

export default { showQuickNotificationStatus };