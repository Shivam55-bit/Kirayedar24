/**
 * FCM Test Service - TEMPORARILY DISABLED
 * All Firebase Cloud Messaging functionality has been stubbed out
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

/**
 * Run FCM diagnostics (DISABLED)
 */
export const runFCMDiagnostics = async () => {
  console.log(' FCM Diagnostics - DISABLED');
  return { 
    overall: 'DISABLED', 
    checks: {
      firebaseInit: { status: 'DISABLED', message: 'FCM temporarily disabled' },
      permissions: { status: 'DISABLED', message: 'FCM temporarily disabled' },
      token: { status: 'DISABLED', message: 'FCM temporarily disabled' }
    }, 
    recommendations: ['FCM is temporarily disabled'],
    summary: { passed: 0, failed: 0, warnings: 0 }
  };
};

/**
 * Run complete FCM test (DISABLED)
 */
export const runCompleteFCMTest = async () => {
  console.log(' FCM Test - DISABLED');
  return { 
    success: false, 
    error: 'FCM disabled',
    timestamp: new Date().toISOString(),
    overall: 'DISABLED',
    tests: {}
  };
};

/**
 * Send test FCM notification (DISABLED)
 */
export const sendTestFCMNotification = async () => {
  console.log(' Test Notification - DISABLED');
  Alert.alert('FCM Disabled', 'FCM is temporarily disabled');
  return { success: false, error: 'FCM disabled' };
};

/**
 * Show FCM test results (DISABLED)
 */
export const showFCMTestResults = (results) => {
  console.log(' FCM Results - DISABLED');
  Alert.alert('FCM Disabled', 'FCM testing is temporarily disabled');
};

export default { 
  runFCMDiagnostics, 
  runCompleteFCMTest, 
  sendTestFCMNotification, 
  showFCMTestResults 
};
