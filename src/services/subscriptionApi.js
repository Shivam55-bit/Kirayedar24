import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api.config';

const API_BASE = `${BASE_URL}/api/tenant-subscription`;

/**
 * Get authentication token
 */
const getAuthToken = async () => {
  try {
    // Try multiple possible token keys
    let token = await AsyncStorage.getItem('userToken');
    
    if (!token) {
      token = await AsyncStorage.getItem('token');
    }
    
    if (!token) {
      token = await AsyncStorage.getItem('authToken');
    }
    
    if (token) {
      console.log('✅ Token found:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ No token found in AsyncStorage');
      // Log all keys to debug
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📦 Available AsyncStorage keys:', allKeys);
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get active subscription for logged-in user
 */
export const getActiveSubscription = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const response = await axios.get(`${API_BASE}/active`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get active subscription error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get active subscription',
      error: error.response?.data,
    };
  }
};

/**
 * Get all available subscription packages
 */
export const getSubscriptionPackages = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const response = await axios.get(`${API_BASE}/packages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get subscription packages error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get subscription packages',
      error: error.response?.data,
    };
  }
};

/**
 * Create subscription order
 */
export const createSubscriptionOrder = async (packageId) => {
  let token = null;
  try {
    token = await getAuthToken();
    if (!token) {
      console.error('❌ No token found for create-order');
      return { success: false, message: 'No authentication token found' };
    }

    console.log('📤 Creating order with:');
    console.log('   Token:', token.substring(0, 30) + '...');
    console.log('   Package ID:', packageId);
    console.log('   URL:', `${API_BASE}/create-order`);

    // Backend expects "subscriptionPackageId" not "packageId"
    const requestBody = { 
      subscriptionPackageId: packageId  // ✅ Changed key name
    };
    
    console.log('   Request Body:', JSON.stringify(requestBody));

    const response = await axios.post(
      `${API_BASE}/create-order`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Create order success:', response.data);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('❌ Create subscription order error:', error.response?.data || error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Full Error Response:', JSON.stringify(error.response?.data));
    console.error('   Package ID sent:', packageId);
    if (token) {
      console.error('   Token used (first 30 chars):', token.substring(0, 30) + '...');
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create order',
      error: error.response?.data,
    };
  }
};

/**
 * Verify payment after successful Razorpay transaction
 */
export const verifySubscriptionPayment = async (paymentData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const response = await axios.post(
      `${API_BASE}/verify-payment`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Verify subscription payment error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Payment verification failed',
      error: error.response?.data,
    };
  }
};

/**
 * Get subscription history
 */
export const getSubscriptionHistory = async (page = 1, limit = 10) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const response = await axios.get(`${API_BASE}/history`, {
      params: { page, limit },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get subscription history error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get subscription history',
      error: error.response?.data,
    };
  }
};

export default {
  getActiveSubscription,
  getSubscriptionPackages,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getSubscriptionHistory,
};
