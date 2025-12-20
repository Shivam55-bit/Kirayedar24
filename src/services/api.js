import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, API_TIMEOUT } from '../config/api.config';

// Helper function to make requests with auto token handling
const makeRequest = async (endpoint, options = {}) => {
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
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    console.log('🚀 API Request:', { url, method: config.method, headers: config.headers });
    
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        console.log('📡 API Response:', { status: response.status, data });
      } catch (jsonError) {
        console.error('❌ JSON Parse Error:', jsonError);
        const responseText = await response.text();
        console.error('📄 Raw response:', responseText);
        return {
          success: false,
          status: response.status,
          message: 'Server returned invalid JSON response',
          error: `JSON Parse Error: ${jsonError.message}`,
          rawResponse: responseText
        };
      }
    } else {
      // Not JSON response - get as text for debugging
      const responseText = await response.text();
      console.error('❌ Non-JSON response:', responseText);
      return {
        success: false,
        status: response.status,
        message: `Server returned non-JSON response (${contentType})`,
        error: 'Invalid response format',
        rawResponse: responseText
      };
    }
    
    if (!response.ok) {
      console.error('❌ API Error:', { status: response.status, data });
    }
    
    return {
      success: response.ok,
      status: response.status,
      message: data.message || data.error || (response.ok ? 'Success' : 'Request failed'),
      data: data,
      ...data // Spread response data for backward compatibility
    };
  } catch (error) {
    console.error('🔥 Network Error:', error);
    
    // Check if it's a network connectivity issue
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Unable to connect to server. Please check your internet connection.',
        error: error.message,
        isNetworkError: true
      };
    }
    
    return {
      success: false,
      message: error.message || 'Network connection failed',
      error: error.message
    };
  }
};

// Authentication API functions
export const signup = async (userData) => {
  return makeRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const login = async (email, password) => {
  const response = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  // Store token if login successful
  if (response.success && response.token) {
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('userId', response.userId || response.user?.id || '');
    await AsyncStorage.setItem('userData', JSON.stringify(response.user || {}));
  }

  return response;
};

export const sendEmailOtp = async (email) => {
  return makeRequest('/auth/send-email-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

export const verifyEmailOtp = async (email, otp) => {
  return makeRequest('/auth/verify-email-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  });
};

export const sendPhoneOtp = async (phone) => {
  return makeRequest('/auth/send-phone-otp', {
    method: 'POST',
    body: JSON.stringify({ phone })
  });
};

export const verifyPhoneOtp = async (phone, otp) => {
  const response = await makeRequest('/auth/verify-phone-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp })
  });

  // Store token if verification successful and user exists
  if (response.success && response.token) {
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('userId', response.userId || response.user?.id || '');
    await AsyncStorage.setItem('userData', JSON.stringify(response.user || {}));
  }

  return response;
};

export const completeRegistration = async (userData) => {
  const response = await makeRequest('/auth/complete-registration', {
    method: 'POST',
    body: JSON.stringify(userData)
  });

  // Store token if registration successful
  if (response.success && response.token) {
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('userId', response.userId || response.user?.id || '');
    await AsyncStorage.setItem('userData', JSON.stringify(response.user || {}));
  }

  return response;
};

export const logout = async () => {
  const response = await makeRequest('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({})
  });

  // Clear stored data regardless of response
  await AsyncStorage.multiRemove(['authToken', 'userId', 'userData']);

  return response;
};

export const sendFCMTokenToBackend = async (userId, fcmToken) => {
  return makeRequest('/api/save-token', {
    method: 'POST',
    body: JSON.stringify({ userId, fcmToken })
  });
};

export const refreshToken = async () => {
  const refreshTokenValue = await AsyncStorage.getItem('refreshToken');
  
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }

  const response = await makeRequest('/auth/refresh-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshTokenValue}`
    }
  });

  if (response.success && response.token) {
    await AsyncStorage.setItem('authToken', response.token);
    if (response.refreshToken) {
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
    }
  }

  return response;
};

// Property Save/Unsave API functions
export const saveProperty = async (propertyId) => {
  return makeRequest(`/api/properties/save?propertyId=${propertyId}`, {
    method: 'POST'
  });
};

export const getSavedProperties = async () => {
  return makeRequest('/api/properties/saved/all', {
    method: 'GET'
  });
};

export const removeSavedProperty = async (propertyId) => {
  return makeRequest(`/api/properties/remove?propertyId=${propertyId}`, {
    method: 'DELETE'
  });
};

// Get user's posted properties (for owners)
export const getMySellProperties = async () => {
  return makeRequest('/api/properties/my-sell-properties', {
    method: 'GET'
  });
};

// Add new property
export const addProperty = async (formData) => {
  const token = await AsyncStorage.getItem('authToken');
  
  if (!token) {
    return {
      success: false,
      message: 'Authentication required. Please login again.',
      error: 'No auth token found'
    };
  }

  try {
    const url = `${BASE_URL}/property/add`;
    console.log('🚀 Making property API call to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let fetch handle it
      },
      body: formData
    });

    console.log('📡 Property API Response Status:', response.status);
    console.log('📡 Property API Response Headers:', Object.fromEntries(response.headers.entries()));

    // Get response text first
    const responseText = await response.text();
    console.log('📄 Raw Property API Response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Parsed Property API Response:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse property API response as JSON:', parseError.message);
      return {
        success: false,
        status: response.status,
        message: 'Server returned invalid response format',
        error: parseError.message,
        rawResponse: responseText
      };
    }

    return {
      success: response.ok && (data.success || data.message === "Property added successfully!"),
      status: response.status,
      message: data.message || (response.ok ? 'Property added successfully!' : 'Failed to add property'),
      data: data,
      property: data.property,
      ...data // Spread response data
    };

  } catch (error) {
    console.error('🔥 Property API Network Error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error.message,
      isNetworkError: true
    };
  }
};