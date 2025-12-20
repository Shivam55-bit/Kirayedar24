import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api.config';

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  if (!BASE_URL) {
    console.error('❌ BASE_URL is not configured. Please update src/config/api.config.js');
    return {
      success: false,
      message: 'API configuration missing',
      error: 'BASE_URL not configured'
    };
  }

  const url = `${BASE_URL}${endpoint}`;
  
  // Get stored token for authenticated requests
  const token = await AsyncStorage.getItem('authToken');
  
  if (!token) {
    return {
      success: false,
      message: 'Authentication required',
      error: 'No auth token found'
    };
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      ...data // Spread response data for backward compatibility
    };
  } catch (error) {
    console.error('User API Request Error:', error);
    return {
      success: false,
      message: error.message || 'Network error',
      error: error.message
    };
  }
};

// Get user profile by ID
export const getUserProfile = async (userId) => {
  if (!userId) {
    // Try to get user ID from storage if not provided
    try {
      userId = await AsyncStorage.getItem('userId');
    } catch (error) {
      console.error('Failed to get userId from storage:', error);
    }
  }

  if (!userId) {
    return {
      success: false,
      message: 'User ID is required',
      error: 'Missing user ID'
    };
  }

  return makeAuthenticatedRequest(`/auth/users/${userId}`, {
    method: 'GET'
  });
};

// Edit user profile
export const editUserProfile = async (userId, profileData) => {
  if (!userId) {
    // Try to get user ID from storage if not provided
    try {
      userId = await AsyncStorage.getItem('userId');
    } catch (error) {
      console.error('Failed to get userId from storage:', error);
    }
  }

  if (!userId) {
    return {
      success: false,
      message: 'User ID is required',
      error: 'Missing user ID'
    };
  }

  if (!profileData || typeof profileData !== 'object') {
    return {
      success: false,
      message: 'Profile data is required',
      error: 'Missing profile data'
    };
  }

  const response = await makeAuthenticatedRequest(`/auth/edit-profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });

  // Update stored user data if edit was successful
  if (response.success && response.user) {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    } catch (error) {
      console.error('Failed to update stored user data:', error);
    }
  }

  return response;
};

// Get current user profile (uses stored user ID)
export const getCurrentUserProfile = async () => {
  const userId = await AsyncStorage.getItem('userId');
  return getUserProfile(userId);
};

// Update current user profile (uses stored user ID)
export const updateCurrentUserProfile = async (profileData) => {
  const userId = await AsyncStorage.getItem('userId');
  return editUserProfile(userId, profileData);
};

// Validate profile data before sending
export const validateProfileData = (profileData) => {
  const errors = [];
  
  if (!profileData.fullName || profileData.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  
  if (!profileData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
    errors.push('Valid email is required');
  }
  
  if (!profileData.phone || !/^\d{10}$/.test(profileData.phone)) {
    errors.push('Valid 10-digit phone number is required');
  }
  
  if (!profileData.state || profileData.state.trim().length < 2) {
    errors.push('State is required');
  }
  
  if (!profileData.city || profileData.city.trim().length < 2) {
    errors.push('City is required');
  }
  
  if (!profileData.pinCode || !/^\d{6}$/.test(profileData.pinCode)) {
    errors.push('Valid 6-digit PIN code is required');
  }
  
  // Password is optional for profile updates
  if (profileData.password && profileData.password.length < 6) {
    errors.push('Password must be at least 6 characters if provided');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

export default {
  getUserProfile,
  editUserProfile,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  validateProfileData
};