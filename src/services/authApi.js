import * as API from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Authentication Service
export const authService = {
  
  // User Signup
  signup: async (userData) => {
    try {
      console.log('🔐 Creating new account for:', userData.email);
      console.log('📤 Signup data:', userData);
      
      const response = await API.signup(userData);
      console.log('📥 Signup response:', response);
      
      if (response.success) {
        console.log('✅ Account created successfully');
      } else {
        console.error('❌ Signup failed:', response.message || response.error || 'Unknown error');
      }
      
      return {
        success: response.success,
        message: response.message || response.error || (response.success ? 'Account created successfully' : 'Signup failed'),
        data: response.data,
        user: response.user
      };
    } catch (error) {
      console.error('🔥 Auth Service - Signup Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create account - please check your connection'
      };
    }
  },

  // User Login (Email/Password)
  login: async (email, password) => {
    try {
      console.log('Logging in user:', email);
      const response = await API.login(email, password);
      
      if (response.success && response.token) {
        console.log('Login successful, token stored');
      } else {
        console.error('Login failed:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('Auth Service - Login Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to login'
      };
    }
  },

  // Send Email OTP
  sendEmailOtp: async (email) => {
    try {
      console.log('Sending email OTP to:', email);
      const response = await API.sendEmailOtp(email);
      
      console.log('Email OTP response:', response);
      return response;
    } catch (error) {
      console.error('Auth Service - Send Email OTP Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send email OTP'
      };
    }
  },

  // Verify Email OTP
  verifyEmailOtp: async (email, otp) => {
    try {
      console.log('Verifying email OTP for:', email);
      const response = await API.verifyEmailOtp(email, otp);
      
      console.log('Email OTP verification response:', response);
      return response;
    } catch (error) {
      console.error('Auth Service - Verify Email OTP Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify email OTP'
      };
    }
  },

  // Send Phone OTP
  sendPhoneOtp: async (phoneNumber) => {
    try {
      console.log('Sending phone OTP to:', phoneNumber);
      const response = await API.sendPhoneOtp(phoneNumber);
      
      console.log('Phone OTP response:', response);
      
      // Show development alert
      if (__DEV__ && response.success) {
        setTimeout(() => {
          alert(`📱 OTP Sent Successfully!\\n\\nOTP sent to ${phoneNumber}\\n\\n🔑 Check backend console for OTP code`);
        }, 1000);
      }
      
      return response;
    } catch (error) {
      console.error('Auth Service - Send Phone OTP Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send phone OTP'
      };
    }
  },

  // Verify Phone OTP and Login
  verifyPhoneOtp: async (phoneNumber, otp) => {
    try {
      console.log('Verifying phone OTP for:', phoneNumber);
      const response = await API.verifyPhoneOtp(phoneNumber, otp);
      
      console.log('Phone OTP verification response:', response);
      
      if (response.success) {
        if (response.token) {
          // Existing user - logged in successfully
          console.log('Existing user logged in with phone OTP');
        } else if (response.isNewUser) {
          // New user - needs to complete registration
          console.log('New user detected, registration required');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Auth Service - Verify Phone OTP Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify phone OTP'
      };
    }
  },

  // Complete Registration for new users
  completeRegistration: async (userData) => {
    try {
      console.log('Completing registration for new user:', userData.email);
      const response = await API.completeRegistration(userData);
      
      if (response.success && response.token) {
        console.log('Registration completed successfully');
      } else {
        console.error('Registration completion failed:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('Auth Service - Complete Registration Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to complete registration'
      };
    }
  },

  // User Logout
  logout: async () => {
    try {
      console.log('Logging out user');
      const response = await API.logout();
      
      console.log('Logout completed');
      return response;
    } catch (error) {
      console.error('Auth Service - Logout Error:', error);
      // Even if API fails, clear local data
      await AsyncStorage.multiRemove(['authToken', 'userId', 'userData']);
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  },

  // Check if user is logged in
  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Check if user exists by phone number
  checkUserByPhone: async (phoneNumber) => {
    try {
      console.log('🔍 Checking if user exists for phone:', phoneNumber);
      const response = await API.checkUserByPhone(phoneNumber);
      console.log('📥 Raw API response:', response);
      console.log('📊 Response type:', typeof response);
      console.log('✅ Success?', response.success);
      console.log('👤 Exists?', response.exists);
      
      // Handle successful response
      if (response.success !== undefined) {
        return {
          exists: response.exists || false,
          user: response.user || null,
          success: response.success
        };
      }
      
      // Fallback if response format is unexpected
      console.warn('⚠️ Unexpected response format, assuming user does not exist');
      return {
        exists: false,
        user: null,
        success: false
      };
    } catch (error) {
      console.error('🔥 Auth Service - Check User Error:', error);
      console.error('🔥 Error details:', error.message);
      // If API fails, assume user doesn't exist to allow registration
      return {
        exists: false,
        user: null,
        success: false,
        error: error.message
      };
    }
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }
};

export default authService;