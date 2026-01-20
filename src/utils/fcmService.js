/**
 * Firebase Cloud Messaging (FCM) Service
 * TEMPORARILY DISABLED - All functions return stubs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for FCM token
const FCM_TOKEN_KEY = '@fcm_token';

// STUB FUNCTIONS - FCM TEMPORARILY DISABLED

export const requestNotificationPermission = async () => {
  console.log('⚠️ FCM temporarily disabled - requestNotificationPermission');
  return false;
};

export const getFCMToken = async () => {
  console.log('⚠️ FCM temporarily disabled - getFCMToken');
  return null;
};

export const getStoredFCMToken = async () => {
  console.log('⚠️ FCM temporarily disabled - getStoredFCMToken');
  return null;
};

export const createNotificationChannel = async () => {
  console.log('⚠️ FCM temporarily disabled - createNotificationChannel');
};

export const displayLocalNotification = async (options) => {
  console.log('⚠️ FCM temporarily disabled - displayLocalNotification');
};

export const initializeFCM = async (onTokenRefresh, onNotificationOpened) => {
  console.log('⚠️ FCM temporarily disabled - initializeFCM');
  return {
    configured: false,
    token: null,
    error: 'FCM temporarily disabled',
    cleanup: () => {}
  };
};

export const setupForegroundHandler = (onNotification) => {
  console.log('⚠️ FCM temporarily disabled - setupForegroundHandler');
  return () => {};
};

export const setupBackgroundHandler = (onNotification) => {
  console.log('⚠️ FCM temporarily disabled - setupBackgroundHandler');
};

export const getInitialNotification = async () => {
  console.log('⚠️ FCM temporarily disabled - getInitialNotification');
  return null;
};

export const onNotificationOpenedApp = (callback) => {
  console.log('⚠️ FCM temporarily disabled - onNotificationOpenedApp');
  return () => {};
};

export const onTokenRefresh = (callback) => {
  console.log('⚠️ FCM temporarily disabled - onTokenRefresh');
  return () => {};
};

export default {
  requestNotificationPermission,
  getFCMToken,
  getStoredFCMToken,
  createNotificationChannel,
  displayLocalNotification,
  initializeFCM,
  setupForegroundHandler,
  setupBackgroundHandler,
  getInitialNotification,
  onNotificationOpenedApp,
  onTokenRefresh
};
