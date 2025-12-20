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
  console.log('🌐 Making authenticated request to:', url);
  
  // Validate endpoint format
  if (!endpoint.startsWith('/')) {
    console.warn('⚠️ Endpoint should start with /:', endpoint);
  }
  
  // Get stored token for authenticated requests
  const token = await AsyncStorage.getItem('authToken');
  
  if (!token) {
    console.warn('⚠️ No auth token found, request may fail');
    return {
      success: false,
      message: 'Authentication required',
      error: 'No auth token found'
    };
  }
  
  console.log('🔑 Using auth token:', token.substring(0, 20) + '...');

  const defaultHeaders = {
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
    console.log('🚀 Sending request to:', url);
    console.log('📤 Request config:', {
      method: config.method || 'GET',
      headers: config.headers,
      hasBody: !!config.body
    });
    
    const response = await fetch(url, config);
    console.log('📡 Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        console.log('📦 Response data:', data);
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
      return {
        success: false,
        status: response.status,
        message: data.message || data.error || `Request failed with status ${response.status}`,
        error: data.error || data.message
      };
    }
    
    // Extract the properties array from the response for property endpoints
    const properties = data?.data || data?.properties || [];
    
    return {
      success: true,
      status: response.status,
      data: properties,  // Return the properties array directly
      properties: properties,
      message: data.message || 'Success',
      originalResponse: data  // Keep original response for debugging
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

// Add new property
export const addProperty = async (propertyData, mediaFiles = []) => {
  try {
    console.log('🏠 Adding property with data:', propertyData);
    console.log('📸 Media files count:', mediaFiles.length);
    
    const formData = new FormData();
    
    // Add property details to FormData exactly as curl format
    Object.keys(propertyData).forEach(key => {
      if (propertyData[key] !== null && propertyData[key] !== undefined) {
        const value = propertyData[key].toString();
        console.log(`📝 Adding field: ${key} = "${value}"`);
        formData.append(key, value);
      }
    });
    
    // Add media files (photos and videos)
    if (mediaFiles && mediaFiles.length > 0) {
      console.log(`📸 Adding ${mediaFiles.length} media files`);
      mediaFiles.forEach((file, index) => {
        if (file.uri) {
          const fileType = file.type || 'image/jpeg';
          const fileName = file.name || `media_${index}.${fileType.split('/')[1]}`;
          
          console.log(`🖼️ Adding media file ${index + 1}:`, { uri: file.uri, type: fileType, name: fileName });
          
          formData.append('photosAndVideo', {
            uri: file.uri,
            type: fileType,
            name: fileName
          });
        }
      });
    } else {
      console.log('📸 No media files to upload');
    }

    console.log('🚀 Making API call to /property/add...');
    
    const response = await makeAuthenticatedRequest('/property/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData
    });

    console.log('🎯 Add property response:', response);
    
    return response;
  } catch (error) {
    console.error('💥 Add property error:', error);
    return {
      success: false,
      message: error.message || 'Failed to add property',
      error: error.message
    };
  }
};

// Get all properties (recent/featured)
export const getAllProperties = async () => {
  return makeAuthenticatedRequest('/property/properties', {
    method: 'GET'
  });
};

// Get recent/featured properties for home screen
export const getRecentProperties = async () => {
  try {
    console.log('🌐 Calling getRecentProperties API:', `${BASE_URL}/property/properties`);
    
    const response = await fetch(`${BASE_URL}/property/properties`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Recent properties response status:', response.status);
    const data = await response.json();
    console.log('📦 Recent properties data:', data);
    
    // Handle different response formats from backend
    let properties = [];
    if (data?.success && data?.data) {
      properties = Array.isArray(data.data) ? data.data : [];
    } else if (Array.isArray(data)) {
      properties = data;
    } else if (data?.properties && Array.isArray(data.properties)) {
      properties = data.properties;
    }
    
    console.log(`✅ Processed ${properties.length} recent properties`);
    
    return {
      success: response.ok && properties.length >= 0,
      status: response.status,
      data: properties,
      properties: properties,
      message: data?.message || 'Properties fetched successfully'
    };
  } catch (error) {
    console.error('❌ Get recent properties error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch recent properties',
      error: error.message,
      data: [],
      properties: []
    };
  }
};

// Get residential properties (using main API with filter)
export const getResidentialProperties = async () => {
  try {
    console.log('🌐 Calling getResidentialProperties API');
    
    const response = await fetch(`${BASE_URL}/property/properties?propertyType=Residential`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📦 Residential properties data:', data);
    
    // Handle different response formats
    let properties = [];
    if (data?.success && data?.data) {
      properties = Array.isArray(data.data) ? data.data : [];
    } else if (Array.isArray(data)) {
      properties = data;
    }
    
    // Additional filter to ensure only residential properties
    const residentialProperties = properties.filter(p => p.propertyType === 'Residential');
    
    console.log(`✅ Processed ${residentialProperties.length} residential properties`);
    
    return {
      success: response.ok,
      status: response.status,
      data: residentialProperties,
      properties: residentialProperties,
      message: data?.message || 'Residential properties fetched successfully'
    };
  } catch (error) {
    console.error('❌ Get residential properties error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch residential properties',
      error: error.message,
      data: [],
      properties: []
    };
  }
};

// Get commercial properties (using main API with filter)
export const getCommercialProperties = async () => {
  try {
    console.log('🌐 Calling getCommercialProperties API');
    
    const response = await fetch(`${BASE_URL}/property/properties?propertyType=Commercial`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📦 Commercial properties data:', data);
    
    // Handle different response formats
    let properties = [];
    if (data?.success && data?.data) {
      properties = Array.isArray(data.data) ? data.data : [];
    } else if (Array.isArray(data)) {
      properties = data;
    }
    
    // Additional filter to ensure only commercial properties
    const commercialProperties = properties.filter(p => p.propertyType === 'Commercial');
    
    console.log(`✅ Processed ${commercialProperties.length} commercial properties`);
    
    return {
      success: response.ok,
      status: response.status,
      data: commercialProperties,
      properties: commercialProperties,
      message: data?.message || 'Commercial properties fetched successfully'
    };
  } catch (error) {
    console.error('❌ Get commercial properties error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch commercial properties',
      error: error.message,
      data: [],
      properties: []
    };
  }
};

// Get property by ID
export const getPropertyById = async (propertyId) => {
  return makeAuthenticatedRequest(`/property/${propertyId}`, {
    method: 'GET'
  });
};

// Get user's properties (user's own posted properties)
export const getUserProperties = async () => {
  try {
    console.log('🏠 Getting user specific properties...');
    
    // Get user ID from storage
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      console.warn('⚠️ No user ID found, returning empty array');
      return {
        success: false,
        message: 'User not authenticated',
        data: []
      };
    }
    
    // Get all properties and filter by current user ID
    const response = await fetch(`${BASE_URL}/property/properties`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📦 All properties data for user filter:', data);
    
    // Extract properties and filter by user ID
    let allProperties = [];
    if (data?.success && data?.data) {
      allProperties = Array.isArray(data.data) ? data.data : [];
    } else if (Array.isArray(data)) {
      allProperties = data;
    }
    
    // Filter properties by user ID
    const userProperties = allProperties.filter(property => {
      // Handle both string and ObjectId comparison
      const propertyUserId = property.userId?._id || property.userId;
      return propertyUserId === userId || propertyUserId?.toString() === userId;
    });
    
    console.log(`✅ Found ${userProperties.length} properties for user ${userId}`);
    console.log('🔍 Sample user property:', userProperties[0] || 'None');
    
    return {
      success: true,
      message: `Found ${userProperties.length} properties`,
      data: userProperties,
      properties: userProperties
    };
    
  } catch (error) {
    console.error('❌ Get user properties error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch user properties',
      error: error.message,
      data: []
    };
  }
};

// Update property
export const updateProperty = async (propertyId, propertyData, mediaFiles = []) => {
  try {
    const formData = new FormData();
    
    // Add property details to FormData
    Object.keys(propertyData).forEach(key => {
      if (propertyData[key] !== null && propertyData[key] !== undefined) {
        formData.append(key, propertyData[key]);
      }
    });
    
    // Add media files if provided
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file, index) => {
        if (file.uri) {
          const fileType = file.type || 'image/jpeg';
          const fileName = file.name || `media_${index}.${fileType.split('/')[1]}`;
          
          formData.append('photosAndVideo', {
            uri: file.uri,
            type: fileType,
            name: fileName
          });
        }
      });
    }

    const response = await makeAuthenticatedRequest(`/property/update/${propertyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData
    });

    return response;
  } catch (error) {
    console.error('Update property error:', error);
    return {
      success: false,
      message: error.message || 'Failed to update property',
      error: error.message
    };
  }
};

// Delete property
export const deleteProperty = async (propertyId) => {
  return makeAuthenticatedRequest(`/property/delete/${propertyId}`, {
    method: 'DELETE'
  });
};

// Search properties with filters
export const searchProperties = async (searchParams) => {
  const queryString = new URLSearchParams(searchParams).toString();
  return makeAuthenticatedRequest(`/property/search?${queryString}`, {
    method: 'GET'
  });
};

// Validate property data before sending
export const validatePropertyData = (propertyData) => {
  const errors = [];
  
  if (!propertyData.propertyLocation || propertyData.propertyLocation.trim().length < 3) {
    errors.push('Property location must be at least 3 characters');
  }
  
  if (!propertyData.areaDetails || isNaN(propertyData.areaDetails) || propertyData.areaDetails <= 0) {
    errors.push('Valid area details are required');
  }
  
  if (!propertyData.price || isNaN(propertyData.price) || propertyData.price <= 0) {
    errors.push('Valid price is required');
  }

  // Validate floor numbers
  if (!propertyData.floorNumber || isNaN(propertyData.floorNumber) || propertyData.floorNumber <= 0) {
    errors.push('Valid floor number is required');
  }
  
  if (!propertyData.totalFloors || isNaN(propertyData.totalFloors) || propertyData.totalFloors <= 0) {
    errors.push('Valid total floors is required');
  }
  
  if (propertyData.floorNumber && propertyData.totalFloors && propertyData.floorNumber > propertyData.totalFloors) {
    errors.push('Floor number cannot be greater than total floors');
  }
  
  if (!propertyData.description || propertyData.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  
  if (!propertyData.contactNumber || propertyData.contactNumber.trim().length < 10) {
    errors.push('Valid contact number is required');
  }
  
  if (!propertyData.purpose) {
    errors.push('Property purpose is required');
  }
  
  if (!propertyData.propertyType) {
    errors.push('Property type is required');
  }
  
  // Residential specific validations
  if (propertyData.propertyType === 'Residential') {
    if (!propertyData.residentialType) {
      errors.push('Residential type is required');
    }
    
    if (!propertyData.bedrooms || isNaN(propertyData.bedrooms) || propertyData.bedrooms <= 0) {
      errors.push('Valid number of bedrooms is required');
    }
    
    if (!propertyData.bathrooms || isNaN(propertyData.bathrooms) || propertyData.bathrooms <= 0) {
      errors.push('Valid number of bathrooms is required');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};