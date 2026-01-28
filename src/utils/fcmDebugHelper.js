/**
 * FCM Debug Helper
 * Easy console commands to test FCM functionality
 */

import { runCompleteFCMTest, sendTestFCMNotification } from './fcmTestService';
import { getFCMToken } from './fcmService';
import { addNotification } from './notificationManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Global FCM testing functions for console/debugging
 * You can call these from anywhere in your app or console
 */

// Quick FCM test - call this from console or any component
global.testFCM = async () => {
  console.log('🧪 Starting FCM Quick Test...');
  try {
    const result = await sendTestFCMNotification();
    console.log('📊 FCM Test Result:', result);
    return result;
  } catch (error) {
    console.error('❌ FCM Test Error:', error);
    return { success: false, error: error.message };
  }
};

// Full FCM diagnostics - comprehensive test
global.testFCMFull = async () => {
  console.log('🔍 Starting Full FCM Diagnostics...');
  try {
    const result = await runCompleteFCMTest();
    console.log('📊 Full FCM Test Results:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Full FCM Test Error:', error);
    return { success: false, error: error.message };
  }
};

// Get current FCM token
global.getFCMToken = async () => {
  console.log('🎫 Getting FCM Token...');
  try {
    const token = await getFCMToken();
    console.log('✅ FCM Token:', token);
    return token;
  } catch (error) {
    console.error('❌ Token Error:', error);
    return null;
  }
};

// Check FCM configuration
global.checkFCMConfig = async () => {
  console.log('⚙️ Checking FCM Configuration...');
  try {
    // Import here to avoid circular dependencies
    const { checkFCMConfiguration } = await import('./fcmService');
    const config = await checkFCMConfiguration();
    console.log('📋 FCM Configuration:', config);
    return config;
  } catch (error) {
    console.error('❌ Config Check Error:', error);
    return { configured: false, error: error.message };
  }
};

// Add test notification locally
global.addTestNotification = async () => {
  console.log('📝 Adding Test Notification...');
  try {
    const notification = {
      title: '🧪 Debug Test Notification',
      message: 'This is a test notification added via debug helper',
      type: 'test',
    };
    
    const result = await addNotification(notification);
    console.log('✅ Test Notification Added:', result);
    return result;
  } catch (error) {
    console.error('❌ Add Notification Error:', error);
    return null;
  }
};

// Check stored FCM token
global.checkStoredToken = async () => {
  console.log('💾 Checking Stored FCM Token...');
  try {
    const token = await AsyncStorage.getItem('@fcm_token');
    const currentToken = await AsyncStorage.getItem('current_fcm_token');
    const userId = await AsyncStorage.getItem('userId');
    const authToken = await AsyncStorage.getItem('authToken');
    
    console.log('📋 Stored Tokens:');
    console.log('  FCM Token Key:', token ? `${token.substring(0, 20)}...` : 'None');
    console.log('  Current Token:', currentToken ? `${currentToken.substring(0, 20)}...` : 'None');
    console.log('  User ID:', userId || 'Not set');
    console.log('  Auth Token:', authToken ? 'Present' : 'Missing');
    
    return { token, currentToken, userId, hasAuthToken: !!authToken };
  } catch (error) {
    console.error('❌ Token Check Error:', error);
    return null;
  }
};

// Check if FCM token was sent to backend
global.checkFCMTokenSentToBackend = async () => {
  console.log('🔍 Checking if FCM Token was sent to backend...\n');
  try {
    const token = await AsyncStorage.getItem('@fcm_token');
    const userId = await AsyncStorage.getItem('userId');
    const authToken = await AsyncStorage.getItem('authToken');
    
    console.log('Step 1: Check prerequisites');
    console.log('  ✓ FCM Token exists:', !!token);
    console.log('  ✓ User ID exists:', !!userId);
    console.log('  ✓ Auth Token exists:', !!authToken);
    
    if (!token || !userId || !authToken) {
      console.log('\n❌ Missing required data - user might not be logged in properly\n');
      return { 
        success: false, 
        error: 'Missing prerequisites',
        details: { hasToken: !!token, hasUserId: !!userId, hasAuthToken: !!authToken }
      };
    }
    
    console.log('\nStep 2: Call sendFCMTokenToBackend');
    const { sendFCMTokenToBackend } = await import('../services/api');
    const response = await sendFCMTokenToBackend(userId, token);
    
    console.log('\nStep 3: Check response');
    console.log('  Response:', JSON.stringify(response, null, 2));
    
    if (response.success) {
      console.log('\n✅ FCM Token successfully sent to backend!');
      console.log('  Token: ' + token.substring(0, 30) + '...');
      console.log('  User: ' + userId);
    } else {
      console.log('\n❌ Failed to send FCM token');
      console.log('  Error:', response.message || response.error);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error checking FCM token status:', error.message);
    return { success: false, error: error.message };
  }
};

// Test backend notification (if endpoint exists)
global.testBackendNotification = async (customToken = null) => {
  console.log('🌐 Testing Backend Notification...');
  try {
    const token = customToken || await getFCMToken();
    if (!token) {
      throw new Error('No FCM token available');
    }
    
    const { BASE_URL } = await import('../config/api.config');
    if (!BASE_URL) {
      throw new Error('BASE_URL not configured');
    }
    const response = await fetch(`${BASE_URL}/test-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        notification: {
          title: '🌐 Backend Test Notification',
          body: 'Testing FCM from backend API'
        },
        data: {
          type: 'backend_test',
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const result = await response.json();
    console.log('📤 Backend Test Result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Backend Test Error:', error);
    return { success: false, error: error.message };
  }
};

// Help function to show all available commands
global.fcmHelp = () => {
  console.log(`
🔥 FCM Debug Helper Commands:

📱 Basic Tests:
  testFCM()                    - Quick FCM test
  testFCMFull()               - Full FCM diagnostics
  addTestNotification()        - Add local test notification

🔧 Configuration:
  getFCMToken()               - Get current FCM token
  checkFCMConfig()            - Check FCM configuration
  checkStoredToken()          - Check stored tokens

🌐 Backend Tests:
  testBackendNotification()   - Test backend notification API
  testBackendNotification(token) - Test with specific token
  checkFCMTokenSentToBackend() - Verify FCM token sent to backend

📚 Usage Examples:
  // Quick test
  await testFCM()
  
  // Get token for backend testing
  const token = await getFCMToken()
  console.log('Token:', token)
  
  // Full diagnostics
  await testFCMFull()
  
  // Add local notification
  await addTestNotification()
  
  // Check if FCM token reached backend
  await checkFCMTokenSentToBackend()

Type fcmHelp() again to see this help.
  `);
};

// Show help on import
console.log('🔥 FCM Debug Helper loaded! Type fcmHelp() for available commands.');

export default {
  testFCM: global.testFCM,
  testFCMFull: global.testFCMFull,
  getFCMToken: global.getFCMToken,
  checkFCMConfig: global.checkFCMConfig,
  addTestNotification: global.addTestNotification,
  checkStoredToken: global.checkStoredToken,
  testBackendNotification: global.testBackendNotification,
  checkFCMTokenSentToBackend: global.checkFCMTokenSentToBackend,
  fcmHelp: global.fcmHelp
};