/**
 * Chat API Service - Production Ready
 * Integrates with existing backend APIs
 * 
 * Available Endpoints:
 * 1. POST   /api/chat/:ownerId - Create/get chat with owner
 * 2. GET    /api/chat - Get all user chats
 * 3. GET    /api/chat/:chatId - Get chat details
 * 4. POST   /api/chat/:chatId/message - Send message
 * 5. PATCH  /api/chat/:chatId/read - Mark as read
 * 6. DELETE /api/chat/:chatId - Delete chat
 * 7. PUT    /api/chat/:chatId/message/:messageId - Edit message
 * 8. DELETE /api/chat/:chatId/message/:messageId - Delete message
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRequest } from './api';
import { BASE_URL } from '../config/api.config';

// Get auth token
export const getAuthToken = async () => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        return token;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

// Get current user ID
export const getCurrentUserId = async () => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        return userId;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
};

/**
 * Get or create a chat with an owner/user
 * POST /api/chat/:ownerId
 * Returns chat object with _id, participants, messages, etc.
 */
export const getOrCreateChat = async (ownerId) => {
    try {
        if (!ownerId) {
            console.error('❌ getOrCreateChat: ownerId is required');
            return { success: false, error: 'Owner ID is required' };
        }

        console.log('🔄 Creating/fetching chat with owner:', ownerId);

        const response = await makeRequest(`/api/chat/${ownerId}`, {
            method: 'POST',
        });

        if (response.success && response.data) {
            const chat = response.data.chat || response.data;
            console.log('✅ Chat created/retrieved:', chat._id);
            return { success: true, chat };
        }

        // Check for specific error messages from backend
        if (response.error) {
            const errorMsg = response.error.toLowerCase();
            if (errorMsg.includes('only tenant can start chat') || errorMsg.includes('tenant')) {
                console.warn('⚠️ Chat restriction: Only tenants can start chat');
                return { 
                    success: false, 
                    error: 'Only tenants can start a chat with property owners. As an owner, please wait for tenants to contact you.',
                    errorType: 'TENANT_ONLY'
                };
            }
        }

        console.warn('⚠️ Could not create/get chat:', response.error || 'Unknown error');
        return { success: false, error: response.error || 'Failed to create chat' };
    } catch (error) {
        console.error('❌ getOrCreateChat error:', error?.message || error);
        
        // Check for 403 error in catch block as well
        const errorMsg = error?.message?.toLowerCase() || '';
        if (errorMsg.includes('only tenant') || errorMsg.includes('403')) {
            return { 
                success: false, 
                error: 'Only tenants can start a chat with property owners. As an owner, please wait for tenants to contact you.',
                errorType: 'TENANT_ONLY'
            };
        }
        
        return { success: false, error: error?.message || 'Network error' };
    }
};

/**
 * Get chat by ID
 * GET /api/chat/:chatId
 */
export const getChatById = async (chatId) => {
    try {
        if (!chatId) {
            console.error('getChatById: chatId is required');
            return null;
        }

        const response = await makeRequest(`/api/chat/${chatId}`, {
            method: 'GET'
        });

        if (response.success && response.data) {
            const chat = response.data.chat || response.data;
            console.log('✅ Chat fetched:', chatId);
            return chat;
        }

        return null;
    } catch (error) {
        console.error('getChatById error:', error);
        return null;
    }
};

/**
 * Send a message directly to a receiver (auto-creates chat if needed)
 * POST /chat/send-message
 * Body: { sender_id, receiver_id, message, message_type }
 * Backend will auto-create chat if it doesn't exist
 * Backend automatically sends FCM notification
 * Returns the created message object with chatId
 */
export const sendMessageToReceiver = async (receiverId, text, currentUserId, propertyId = null) => {
    try {
        if (!receiverId || !text || text.trim() === '') {
                if (__DEV__) console.error('❌ sendMessageToReceiver: receiverId and text are required', { receiverId, text });
                return { success: false, error: 'Message text and receiver are required' };
        }

        if (!currentUserId) {
                if (__DEV__) console.error('❌ sendMessageToReceiver: currentUserId required', { currentUserId });
                return { success: false, error: 'Sender ID is required' };
        }

        const trimmedText = text.trim();
        if (__DEV__) console.log('🔄 Sending message to receiver:', receiverId);

        // Flow: create/get chat with owner then post message to chat
        // Backend endpoint: POST /api/chat/:ownerId  -> returns chat
        const chatResp = await makeRequest(`/api/chat/${receiverId}`, {
            method: 'POST'
        });

        if (!chatResp.success || !chatResp.chat && !chatResp.data?.chat) {
            if (__DEV__) console.error('❌ sendMessageToReceiver: failed to get/create chat', chatResp);
            return { success: false, error: chatResp.error || 'Failed to create chat' };
        }

        const chat = chatResp.chat || chatResp.data?.chat;
        const chatId = chat._id || chat.id;

        // Now send message to chat
        const response = await makeRequest(`/api/chat/${chatId}/message`, {
            method: 'POST',
            body: JSON.stringify({
                text: trimmedText,
                property_id: propertyId || null
            })
        });

        if (response.success) {
            // Backend doesn't return the created message object for POST /api/chat/:chatId/message
            // Fetch the chat to obtain the latest message and return it for UI update
            const fetched = await getChatById(chatId);
            const latestMsg = fetched?.messages && fetched.messages.length ? fetched.messages[fetched.messages.length - 1] : null;
            if (__DEV__) console.log('✅ Message posted, fetched latest message:', latestMsg);
            return { success: true, message: latestMsg, chatId: chatId, chat: fetched };
        }

        if (__DEV__) console.warn('⚠️ Failed to send message:', response.error);
        return { success: false, error: response.error || 'Failed to send message' };
    } catch (error) {
        if (__DEV__) console.error('❌ sendMessageToReceiver error:', error);
        return { success: false, error: error?.message || 'Network error' };
    }
};

/**
 * Send a message in a chat
 * POST /chat/send-message
 * Body: { sender_id, receiver_id, message, message_type }
 * Returns the created message object
 * Backend automatically sends FCM notification
 */
export const sendMessageApi = async (chatId, text, propertyId = null) => {
    try {
        if (!text || text.trim() === '') {
            if (__DEV__) console.error('❌ sendMessageApi: text is required');
            return { success: false, error: 'Message text cannot be empty' };
        }

        if (!chatId) {
            if (__DEV__) console.error('❌ sendMessageApi: chatId is required');
            return { success: false, error: 'Chat ID is required' };
        }

        const trimmedText = text.trim();
        if (__DEV__) console.log('🔄 Sending message to chat:', chatId);

        // Backend endpoint: POST /api/chat/:chatId/message
        const response = await makeRequest(`/api/chat/${chatId}/message`, {
            method: 'POST',
            body: JSON.stringify({
                text: trimmedText,
                property_id: propertyId || null
            })
        });

        if (response.success) {
            // Fetch latest message from chat to return
            const fetched = await getChatById(chatId);
            const latestMsg = fetched?.messages && fetched.messages.length ? fetched.messages[fetched.messages.length - 1] : null;
            if (__DEV__) console.log('✅ Message sent, latest fetched message:', latestMsg);
            return { success: true, message: latestMsg, chatId: chatId, chat: fetched };
        }

        if (__DEV__) console.warn('⚠️ Failed to send message:', response.error);
        return { success: false, error: response.error || 'Failed to send message' };
    } catch (error) {
        if (__DEV__) console.error('❌ sendMessageApi error:', error);
        return { success: false, error: error?.message || 'Network error' };
    }
};

/**
 * Mark chat as read
 * PATCH /api/chat/:chatId/read
 */
export const markChatAsRead = async (chatId) => {
    try {
        if (!chatId) return false;

        const response = await makeRequest(`/api/chat/${chatId}/read`, {
            method: 'PATCH'
        });

        return response.success || false;
    } catch (error) {
        console.error('markChatAsRead error:', error);
        return false;
    }
};

/**
 * Get all chats for current user
 * GET /api/chat
 * Returns array of chat objects sorted by updatedAt DESC
 */
export const getUserChats = async () => {
    try {
        console.log('🔄 Fetching all user chats...');
        
        const response = await makeRequest('/api/chat', {
            method: 'GET'
        });

        if (response.success && response.data) {
            const chats = response.data.chats || response.data || [];
            
            if (Array.isArray(chats)) {
                // Sort by updatedAt DESC (newest first)
                const sortedChats = chats.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.createdAt);
                    const dateB = new Date(b.updatedAt || b.createdAt);
                    return dateB - dateA;
                });
                
                console.log(`✅ Fetched ${sortedChats.length} chats`);
                return { success: true, chats: sortedChats };
            }
        }

        console.warn('⚠️ No chats found or invalid response');
        return { success: true, chats: [] };
    } catch (error) {
        console.error('❌ getUserChats error:', error);
        return { success: false, error: error?.message || 'Failed to fetch chats', chats: [] };
    }
};

// Alias for backward compatibility
export const getChats = getUserChats;

/**
 * Delete a chat
 * DELETE /api/chat/:chatId
 * Returns success boolean
 */
export const deleteChat = async (chatId) => {
    try {
        if (!chatId) {
            console.error('❌ deleteChat: chatId is required');
            return { success: false, error: 'Chat ID is required' };
        }

        console.log('🔄 Deleting chat:', chatId);

        const response = await makeRequest(`/api/chat/${chatId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            console.log('✅ Chat deleted successfully');
            return { success: true, message: 'Chat deleted successfully' };
        }

        return { success: false, error: response.error || 'Failed to delete chat' };
    } catch (error) {
        console.error('❌ deleteChat error:', error);
        return { success: false, error: error?.message || 'Network error' };
    }
};

/**
 * Delete all chats for current user
 * DELETE /api/chats/delete-all
 * Returns success boolean
 */
export const deleteAllChats = async () => {
    try {
        console.log('🔄 Deleting all chats...');

        const response = await makeRequest('/api/chats/delete-all', {
            method: 'DELETE'
        });

        if (response.success) {
            console.log('✅ All chats deleted successfully');
            return { success: true, message: 'All chats deleted successfully' };
        }

        return { success: false, error: response.error || 'Failed to delete all chats' };
    } catch (error) {
        console.error('❌ deleteAllChats error:', error);
        return { success: false, error: error?.message || 'Network error' };
    }
};

/**
 * Delete a message from chat (if supported)
 * DELETE /api/chat/:chatId/message/:messageId
 */
export const deleteMessage = async (chatId, messageId) => {
    try {
        if (!chatId || !messageId) return false;

        const response = await makeRequest(`/api/chat/${chatId}/message/${messageId}`, {
            method: 'DELETE'
        });

        return response.success || false;
    } catch (error) {
        console.error('deleteMessage error:', error);
        return false;
    }
};

/**
 * Edit a message (if supported)
 * PUT /api/chat/:chatId/message/:messageId
 */
export const editMessage = async (chatId, messageId, newText) => {
    try {
        if (!chatId || !messageId || !newText) return null;

        const response = await makeRequest(`/api/chat/${chatId}/message/${messageId}`, {
            method: 'PUT',
            body: JSON.stringify({ text: newText })
        });

        if (response.success && response.data) {
            return response.data.message || response.data;
        }
        return null;
    } catch (error) {
        console.error('editMessage error:', error);
        return null;
    }
};

export default {
    getAuthToken,
    getCurrentUserId,
    getOrCreateChat,
    getChatById,
    sendMessageApi,
    markChatAsRead,
    getUserChats,
    getChats,
    deleteChat,
    deleteAllChats,
    deleteMessage,
    editMessage,
};
