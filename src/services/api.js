import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, API_TIMEOUT } from '../config/api.config';

// Helper function to make requests with auto token handling
export const makeRequest = async (endpoint, options = {}) => {
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
      console.warn('⚠️ Non-JSON response received from server:', { status: response.status, contentType, raw: responseText });

      // If the HTTP status is OK (2xx) treat it as success but include rawResponse so callers can handle it gracefully
      if (response.ok) {
        return {
          success: true,
          status: response.status,
          message: 'Success (non-JSON response)',
          data: null,
          rawResponse: responseText
        };
      }

      // Otherwise return a structured error containing the raw response for easier debugging
      return {
        success: false,
        status: response.status,
        message: `Server returned non-JSON response (${contentType})`,
        error: 'Invalid response format',
        rawResponse: responseText
      };
    }
    
    if (!response.ok) {
      // Use console.warn for expected business logic errors (like 403 permission errors)
      // to avoid showing red error overlay in development
      if (response.status === 403 || response.status === 401) {
        console.warn('⚠️ API Permission/Auth Error:', { status: response.status, message: data?.message || 'Permission denied' });
      } else {
        console.warn('⚠️ API Error:', { status: response.status, data });
      }
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

export const login = async (email, password, fcmToken = null) => {
  const loginData = {
    email,
    password
  };
  
  // Include FCM token if available
  if (fcmToken) {
    loginData.fcmToken = fcmToken;
    console.log('📤 Including FCM token in login request');
  }
  
  const response = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(loginData)
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

export const checkUserByPhone = async (phone) => {
  console.log('\n🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟');
  console.log('📞 API.JS - checkUserByPhone CALLED');
  console.log('🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟');
  console.log('📱 Phone number:', phone);
  console.log('🌐 BASE_URL:', BASE_URL);
  console.log('🎯 Full endpoint:', `${BASE_URL}/auth/check-user`);
  console.log('📦 Request body:', JSON.stringify({ phone }));
  console.log('⏰ Making request...');
  
  const result = await makeRequest('/auth/check-user', {
    method: 'POST',
    body: JSON.stringify({ phone })
  });
  
  console.log('✅ Request completed!');
  console.log('📥 Result:', JSON.stringify(result, null, 2));
  console.log('🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟\n');
  
  return result;
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
  console.log('📤 Sending FCM token to backend...', { userId, fcmToken: fcmToken?.substring(0, 30) + '...' });
  
  // Backend expects fcmTokens as array (multiple device support)
  const response = await makeRequest('/users/fcm-token', {
    method: 'POST',
    body: JSON.stringify({ 
      userId, 
      fcmToken,           // Single token for backward compatibility
      fcmTokens: [fcmToken] // Array format for new backend
    })
  });
  
  console.log('📥 FCM token backend response:', response);
  return response;
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

// Verify Subscription Payment (called before adding a property when a payment/subscription is involved)
export const verifySubscriptionPayment = async (payload = {}) => {
  console.log('[api] verifySubscriptionPayment payload:', payload);
  return makeRequest('/api/subscription-purchase/verify-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Get available subscription packages
export const getSubscriptionPackages = async () => {
  console.log('[api] getSubscriptionPackages called');
  return makeRequest('/api/subscription', {
    method: 'GET'
  });
};

// Create subscription purchase order (backend should return Razorpay order details and key)
export const createSubscriptionOrder = async (payload = {}) => {
  console.log('[api] createSubscriptionOrder payload:', payload);
  return makeRequest('/api/subscription-purchase/create-order', {
    method: 'POST',
    body: JSON.stringify(payload)
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
  console.log('📋 [getMySellProperties] Fetching user properties from:', BASE_URL + '/api/properties/my-sell-properties');
  const result = await makeRequest('/api/properties/my-sell-properties', {
    method: 'GET'
  });
  console.log('📋 [getMySellProperties] API Result:', {
    success: result.success,
    dataCount: result.data?.length || result.properties?.length || 0,
    fullResponse: result
  });
  return result;
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
      // Additional debugging info
      debugInfo: {
        responseOk: response.ok,
        dataSuccess: data.success,
        messageMatch: data.message === "Property added successfully!",
        actualMessage: data.message,
        statusCode: response.status
      },
      ...data // Spread response data
    };

  } catch (error) {
    // Network error - don't log loudly, just return failed response
    // The calling code (AddSellScreen) will handle this with a fallback
    console.log('📡 API Network error (will fall back to local save):', error.message);
    return {
      success: false,
      message: 'Network error. Saving locally instead.',
      error: error.message,
      isNetworkError: true
    };
  }
};

// Location API functions
export const getStates = async () => {
  return makeRequest('/api/location/states', {
    method: 'GET'
  });
};

export const getDistricts = async (stateName) => {
  return makeRequest(`/api/location/districts/${encodeURIComponent(stateName)}`, {
    method: 'GET'
  });
};

export const getCities = async (districtName) => {
  return makeRequest(`/api/location/cities/${encodeURIComponent(districtName)}`, {
    method: 'GET'
  });
};

// Helper function to extract pincode from city data
export const extractPincode = (cityData) => {
  if (typeof cityData === 'string') {
    return null;
  }
  
  // Try different possible field names for pincode
  return cityData?.pincode || cityData?.postal_code || cityData?.zip || cityData?.pin || null;
};

// Update existing property
export const updateProperty = async (propertyId, formData) => {
  const token = await AsyncStorage.getItem('authToken');
  
  if (!token) {
    return {
      success: false,
      message: 'Authentication required. Please login again.',
      error: 'No auth token found'
    };
  }

  try {
    const url = `${BASE_URL}/property/update/${propertyId}`;
    console.log('🚀 Making property update API call to:', url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let fetch handle it
      },
      body: formData
    });

    console.log('📡 Property Update API Response Status:', response.status);
    console.log('📡 Property Update API Response Headers:', Object.fromEntries(response.headers.entries()));

    // Get response text first
    const responseText = await response.text();
    console.log('📄 Raw Property Update API Response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Parsed Property Update API Response:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse property update API response as JSON:', parseError.message);
      return {
        success: false,
        status: response.status,
        message: 'Server returned invalid response format',
        error: parseError.message,
        rawResponse: responseText
      };
    }

    return {
      success: response.ok && (data.success || data.message?.toLowerCase().includes('successfully')),
      status: response.status,
      message: data.message || (response.ok ? 'Property updated successfully!' : 'Failed to update property'),
      data: data,
      property: data.property,
      ...data
    };

  } catch (error) {
    console.error('🔥 Property Update API Network Error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error.message,
      isNetworkError: true
    };
  }
};

// Delete property
export const deleteProperty = async (propertyId) => {
  const token = await AsyncStorage.getItem('authToken');
  
  if (!token) {
    return {
      success: false,
      message: 'Authentication required. Please login again.',
      error: 'No auth token found'
    };
  }

  try {
    const url = `${BASE_URL}/property/delete/${propertyId}`;
    console.log('🚀 Making property delete API call to:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Property Delete API Response Status:', response.status);
    console.log('📡 Property Delete API Response Headers:', Object.fromEntries(response.headers.entries()));

    // Get response text first
    const responseText = await response.text();
    console.log('📄 Raw Property Delete API Response:', responseText);

    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
        console.log('✅ Parsed Property Delete API Response:', data);
      } catch (parseError) {
        console.warn('⚠️ Property delete response is not JSON:', responseText);
        // For delete, 200/204 with empty response is OK
        if (response.ok) {
          return {
            success: true,
            status: response.status,
            message: 'Property deleted successfully!',
            rawResponse: responseText
          };
        }
      }
    }

    return {
      success: response.ok && (data.success || data.message?.toLowerCase().includes('deleted') || response.status === 200),
      status: response.status,
      message: data.message || (response.ok ? 'Property deleted successfully!' : 'Failed to delete property'),
      data: data,
      ...data
    };

  } catch (error) {
    console.error('🔥 Property Delete API Network Error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error.message,
      isNetworkError: true
    };
  }
};