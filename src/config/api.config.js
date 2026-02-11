/**
 * API Configuration
 * 
 * Centralized configuration for all API endpoints
 * Update BASE_URL here when you have your new backend ready
 */

// ⚠️ IMPORTANT: Update this URL when your new backend is ready
export const BASE_URL = 'https://backend.kirayedar24.com';

// Image/uploads base URL - images are stored on this server
// Use this for loading property photos, NOT the API BASE_URL
export const IMAGE_BASE_URL = 'https://backend.kirayedar24.com';

// API timeout configuration
export const API_TIMEOUT = 15000; // 15 seconds

// API version (if needed)
export const API_VERSION = 'v1';

// Socket configuration
export const SOCKET_URL = 'https://backend.kirayedar24.com';  // Same as BASE_URL for socket connections

// Image upload configuration
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Razorpay config - replace with your live/test key as needed
export const RAZORPAY_KEY_ID = 'rzp_live_RzKd8yxLwZpPae'; // Provided by user - fallback key used when backend doesn't return key

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// API Endpoints (relative paths)
export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    SEND_EMAIL_OTP: '/auth/send-email-otp',
    VERIFY_EMAIL_OTP: '/auth/verify-email-otp',
    SEND_PHONE_OTP: '/auth/send-phone-otp',
    VERIFY_PHONE_OTP: '/auth/verify-phone-otp',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  
  // User endpoints
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile/update',
    FCM_TOKEN: '/users/fcm-token',
  },
  
  // Property endpoints
  PROPERTIES: {
    ALL: '/properties/all',
    BY_ID: '/properties/:id',
    SEARCH: '/properties/search',
    CREATE: '/properties/create',
    UPDATE: '/properties/:id/update',
    DELETE: '/properties/:id/delete',
    MY_PROPERTIES: '/properties/my-properties',
    MY_SELL_PROPERTIES: '/api/properties/my-sell-properties',
    SAVED_ALL: '/api/properties/saved/all',
    SAVE: '/api/properties/save',
    REMOVE: '/api/properties/remove',
    NEARBY: '/properties/nearby',
  },
  
  // Chat endpoints
  CHAT: {
    GET_OR_CREATE: '/chat/get-or-create',
    HISTORY: '/chat/history',
    LIST: '/chat/list',
    SEND_MESSAGE: '/chat/message',
    DELETE_MESSAGE: '/chat/message/:id',
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    TEST: '/test-notification',
    SEND: '/notifications/send',
    LIST: '/notifications/list',
    MARK_READ: '/notifications/:id/read',
  },
  
  // Tenant Subscription endpoints
  TENANT_SUBSCRIPTION: {
    ACTIVE: '/api/tenant-subscription/active',
    PACKAGES: '/api/tenant-subscription/packages',
    CREATE_ORDER: '/api/tenant-subscription/create-order',
    VERIFY_PAYMENT: '/api/tenant-subscription/verify-payment',
    HISTORY: '/api/tenant-subscription/history',
  },
};

// Helper function to build full URL
export const buildUrl = (endpoint) => {
  if (!BASE_URL) {
    console.warn('⚠️ BASE_URL is not configured in api.config.js');
    return endpoint;
  }
  return `${BASE_URL.replace(/\/+$/, '')}${endpoint}`;
};

// Helper function to build socket URL
export const getSocketUrl = () => {
  if (!SOCKET_URL) {
    console.warn('⚠️ SOCKET_URL is not configured in api.config.js');
    return '';
  }
  return SOCKET_URL.replace(/\/+$/, '');
};

export default {
  BASE_URL,
  SOCKET_URL,
  API_TIMEOUT,
  API_VERSION,
  DEFAULT_HEADERS,
  ENDPOINTS,
  buildUrl,
  getSocketUrl,
};
