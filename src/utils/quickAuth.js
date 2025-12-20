/**
 * Quick Auth Check Utility
 * Test if user authentication is working properly
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkAuthStatus = async () => {
  try {
    console.log('🔐 Checking authentication status...');
    
    const authToken = await AsyncStorage.getItem('authToken');
    const userData = await AsyncStorage.getItem('userData');
    const userId = await AsyncStorage.getItem('userId');
    
    const authStatus = {
      isLoggedIn: !!authToken,
      hasToken: !!authToken,
      hasUserData: !!userData,
      hasUserId: !!userId,
      tokenLength: authToken?.length || 0,
      tokenPreview: authToken ? `${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 5)}` : null
    };
    
    console.log('🔐 Auth Status:', authStatus);
    
    if (authStatus.isLoggedIn) {
      console.log('✅ User is logged in');
    } else {
      console.log('❌ User is not logged in - auth required APIs will fail');
      console.log('💡 Users should login first for residential/commercial property filters');
    }
    
    return authStatus;
    
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    return {
      isLoggedIn: false,
      error: error.message
    };
  }
};

// Quick login with test credentials for debugging
export const quickTestLogin = async () => {
  try {
    console.log('🧪 Attempting test login...');
    
    const { BASE_URL } = await import('../config/api.config');
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'john@example.com',  // Use the same email from curl
        password: 'password123'     // Common test password
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('userId', data.userId || data.user?.id || '');
      await AsyncStorage.setItem('userData', JSON.stringify(data.user || {}));
      
      console.log('✅ Test login successful, token saved');
      return true;
    } else {
      console.log('❌ Test login failed:', data.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test login error:', error);
    return false;
  }
};

export default { checkAuthStatus, quickTestLogin };