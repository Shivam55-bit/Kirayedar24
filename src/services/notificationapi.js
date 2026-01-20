import { makeRequest } from './api';

/**
 * ✅ UNIFIED NOTIFICATION API (Backend = Source of Truth)
 * All notifications come from backend database only
 */

/**
 * Get paginated notifications from backend
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @param {string} type - Optional filter by notification type
 * @returns {Promise} Response with notifications array and pagination
 */
export const getNotifications = async (page = 1, limit = 20, type = null) => {
  try {
    // ✅ FIXED: Correct endpoint is /api/notification/list (singular with /api prefix)
    let url = `/api/notification/list?page=${page}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    
    const response = await makeRequest(url, {
      method: 'GET',
    });
    
    // If success, return response
    if (response && response.success !== false) {
      return response;
    }
    
    // Return empty array if API fails
    console.warn('⚠️ Notifications API returned unsuccessful response');
    return { success: true, notifications: [], data: [] };
    
  } catch (error) {
    console.error('❌ Error fetching notifications:', error.message);
    // Return empty notifications instead of throwing
    return { success: true, notifications: [], data: [], message: error.message };
  }
};

/**
 * Get unread notification count (for badge)
 * @returns {Promise} Response with { count: number }
 */
export const getUnreadCount = async () => {
  try {
    const response = await makeRequest('/api/notification/unread-count', {
      method: 'GET',
    });
    // Backend returns { success, unreadCount } - normalize to { success, data: { count } }
    if (response.success) {
      return { 
        success: true, 
        data: { count: response.unreadCount || response.data?.unreadCount || 0 } 
      };
    }
    return { success: true, data: { count: 0 } };
  } catch (error) {
    console.warn('⚠️ Unread count API failed:', error.message);
    return { success: true, data: { count: 0 } };
  }
};

/**
 * Mark single notification as read
 * @param {string} notificationId - Notification ID from backend
 * @returns {Promise} Response with success status
 */
export const markNotificationAsRead = async (notificationId) => {
  // ✅ Correct endpoint: PATCH /api/notification/mark-read/{notificationId}
  return makeRequest(`/api/notification/mark-read/${notificationId}`, {
    method: 'PATCH',
  });
};

/**
 * Mark all notifications as read
 * @returns {Promise} Response with success status
 */
export const markAllNotificationsAsRead = async () => {
  // ✅ Correct: POST /api/notification/read-all
  return makeRequest('/api/notification/read-all', {
    method: 'POST',
  });
};

/**
 * Delete single notification
 * @param {string} notificationId - Notification ID from backend
 * @returns {Promise} Response with success status
 */
export const deleteNotification = async (notificationId) => {
  // ✅ Correct: DELETE /api/notification/{notificationId}
  return makeRequest(`/api/notification/${notificationId}`, {
    method: 'DELETE',
  });
};

/**
 * Delete all notifications for current user
 * @returns {Promise} Response with success status
 */
export const deleteAllNotifications = async () => {
  // ✅ Correct: DELETE /api/notification/delete-all
  return makeRequest('/api/notification/delete-all', {
    method: 'DELETE',
  });
};

/**
 * Send push notification for chat message
 * This tells the backend to send a push notification to the receiver
 */
export const sendChatMessageNotification = async ({ receiverId, senderId, senderName, message, chatId, propertyId }) => {
  try {
    // Try to send push notification via backend
    const response = await makeRequest('/api/notification/send-push', {
      method: 'POST',
      body: JSON.stringify({
        userId: receiverId,
        type: 'chat_message',
        title: `New message from ${senderName}`,
        body: message.substring(0, 100),
        data: {
          chatId,
          senderId,
          senderName,
          propertyId,
          type: 'chat_message',
        },
      }),
    });

    if (response.success) {
      console.log('✅ Push notification sent to receiver');
      return true;
    }
    return false;
  } catch (error) {
    // Silent fail - push notifications are non-critical
    console.warn('Push notification failed (non-critical):', error?.message || error);
    return false;
  }
};
