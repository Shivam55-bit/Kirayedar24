/**
 * Authentication Flow Manager
 * Handles the complete authentication flow logic for the app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthFlowManager {
  
  /**
   * Check if user is authenticated
   */
  static async isUserAuthenticated() {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      
      return !!(authToken && userId);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Check if user exists in the system by phone (API call)
   */
  static async checkUserExists(phoneNumber) {
    try {
      // Import API service
      const { authService } = require('../services/authApi');
      
      // Call API to check if user exists
      const response = await authService.checkUserByPhone(phoneNumber);
      return response.exists || false;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Store user authentication data
   */
  static async storeAuthData(authToken, userId, userData) {
    try {
      await AsyncStorage.multiSet([
        ['authToken', authToken],
        ['userId', userId],
        ['userData', JSON.stringify(userData)]
      ]);
      
      // Store user role if available
      if (userData.userType || userData.role) {
        await AsyncStorage.setItem('userRole', userData.userType || userData.role);
      }
      
      return true;
    } catch (error) {
      console.error('Error storing auth data:', error);
      return false;
    }
  }

  /**
   * Clear all authentication data (logout)
   */
  static async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([
        'authToken',
        'userId', 
        'userData',
        'userRole'
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  }

  /**
   * Get user data
   */
  static async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Get user role
   */
  static async getUserRole() {
    try {
      return await AsyncStorage.getItem('userRole') || 'Tenant';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'Tenant';
    }
  }

  /**
   * Determine initial navigation route based on auth status
   */
  static async getInitialRoute() {
    const isAuthenticated = await this.isUserAuthenticated();
    
    if (isAuthenticated) {
      return 'Home'; // User is logged in, go to home
    } else {
      return 'LoginScreen'; // User not logged in, go to login screen
    }
  }

  /**
   * Handle OTP verification flow
   */
  static async handleOTPVerificationSuccess(phoneNumber, otpResponse) {
    if (otpResponse.token && otpResponse.user) {
      // Existing user - store auth data and navigate to home
      await this.storeAuthData(otpResponse.token, otpResponse.user.id || otpResponse.user._id, otpResponse.user);
      return {
        isNewUser: false,
        navigateTo: 'Home',
        userData: otpResponse.user
      };
    } else if (otpResponse.isNewUser || !otpResponse.token) {
      // New user - needs registration
      return {
        isNewUser: true,
        navigateTo: 'SignupScreen',
        phoneNumber: phoneNumber
      };
    } else {
      throw new Error('Invalid OTP response format');
    }
  }

  /**
   * Handle successful registration
   */
  static async handleRegistrationSuccess(registrationResponse) {
    if (registrationResponse.success && registrationResponse.token && registrationResponse.user) {
      await this.storeAuthData(
        registrationResponse.token, 
        registrationResponse.user.id || registrationResponse.user._id, 
        registrationResponse.user
      );
      return true;
    }
    return false;
  }

  /**
   * Handle successful login
   */
  static async handleLoginSuccess(loginResponse) {
    if (loginResponse.success && loginResponse.token && loginResponse.user) {
      await this.storeAuthData(
        loginResponse.token,
        loginResponse.user.id || loginResponse.user._id,
        loginResponse.user
      );
      return true;
    }
    return false;
  }

  /**
   * Check if this is first app launch
   */
  static async isFirstLaunch() {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return false;
    }
  }
}

export default AuthFlowManager;