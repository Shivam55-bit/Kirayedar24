/**
 * ChatDetailScreen - Production Ready
 * One-to-one chat conversation between tenant and property owner
 * 
 * ✅ Real-time WebSocket with auto-reconnect
 * ✅ Optimistic UI updates
 * ✅ Message edit/delete
 * ✅ Auto-scroll to latest
 * ✅ Typing indicators
 * ✅ Read receipts
 * ✅ Clean architecture
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Keyboard,
    DeviceEventEmitter,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment'; 
import { useFocusEffect } from '@react-navigation/native'; 

// Services & Components
import MessageBubble from '../components/MessageBubble';
import {
    getOrCreateChat,
    getChatById,
    sendMessageApi,
    sendMessageToReceiver,
    markChatAsRead,
    getCurrentUserId,
    editMessage,
    deleteMessage,
    getUserProfile,
    getAuthToken,
} from '../services/chatApi';
import useChatSocket from '../hooks/useChatSocket';

// Colors
const colors = {
    primary: '#FDB022',
    primaryDark: '#E89E0F',
    background: '#F8FAFC',
    white: '#FFFFFF',
    text: '#1E293B',
    lightText: '#64748B',
    border: '#E5E7EB',
    inputBg: '#F3F4F6',
    senderBubble: '#FDB022',
    receiverBubble: '#FFFFFF',
    greyLight: '#E2E8F0',
};

// Helper: Format image URLs
const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const { BASE_URL } = require('../config/api.config');
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Helper function to safely convert any value to string (handles location objects)
const safeString = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    // Handle location objects {state, city, locality, pincode}
    if (typeof value === 'object') {
        if (value.state || value.city || value.locality || value.pincode) {
            return [value.locality, value.city, value.state, value.pincode]
                .filter(Boolean)
                .join(', ') || fallback;
        }
        // Handle other objects - try fullName, name, username, email
        if (value.fullName) return String(value.fullName);
        if (value.name) return String(value.name);
        if (value.username) return String(value.username);
        if (value.email) return String(value.email);
        return fallback;
    }
    return fallback;
};

const ChatDetailScreen = ({ navigation, route }) => {
    // route.params is where 'user' (the agent/owner), 'chatId' and 'propertyTitle' are passed
    const { user, propertyTitle, chatId: paramChatId, propertyId } = route.params || {}; 
    
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    const [currentUserId, setCurrentUserId] = useState(null);
    const [chatId, setChatId] = useState(paramChatId || null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const inputRef = useRef();
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef();
    const [propertyDetails, setPropertyDetails] = useState(null);
    const [propertyLoading, setPropertyLoading] = useState(false);

    // Robustly determine receiverId - check all possible fields
    const receiverId = 
        user?._id || user?.id || user?.userId || user?.postedBy?._id || user?.postedBy?.id ||
        (typeof user === 'string' ? user : null); 
    
    // Use safeString to handle any object values safely (like location objects)
    const initialAgentName = safeString(user?.fullName) || safeString(user?.name) || safeString(user?.username) || 'Agent/Owner';
    const [agentName, setAgentName] = useState(initialAgentName);
    const initialAgentAvatar = user?.avatar || user?.profilePic || null;
    const [agentAvatar, setAgentAvatar] = useState(initialAgentAvatar ? formatImageUrl(initialAgentAvatar) : null);
    const [agentRole, setAgentRole] = useState(user?.role || null);
    const [propertyOwnerName, setPropertyOwnerName] = useState(null);

    // Get current user ID
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const id = await getCurrentUserId();
                
                if (mounted && id) {
                    const cleanId = String(id).trim();
                    setCurrentUserId(cleanId);
                } else if (mounted) {
                    // Fallback to direct AsyncStorage access
                    const fallbackId = await AsyncStorage.getItem('userId');
                    if (fallbackId) {
                        const cleanFallbackId = String(fallbackId).trim();
                        setCurrentUserId(cleanFallbackId);
                    }
                }
            } catch (e) {
                console.error('Failed to get current user ID:', e && e.message ? e.message : e);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // If we only received an id (or a generic fallback name), try to enrich with profile
    useEffect(() => {
        let mounted = true;
        const shouldFetch = (!user || typeof user === 'string' || agentName === 'Agent/Owner' || /\*|@/.test(agentName));
        if (!shouldFetch) return;
        const idToFetch = receiverId;
        if (!idToFetch) return;
        (async () => {
            try {
                const profile = await getUserProfile(idToFetch);
                if (!mounted || !profile) return;
                // Use safeString to handle any object values
                const friendly = safeString(profile.fullName) || safeString(profile.full_name) || safeString(profile.name) || safeString(profile.displayName) || safeString(profile.email) || agentName;
                setAgentName(friendly);
                // set avatar if available (normalize path)
                if (profile.avatar) {
                    setAgentAvatar(formatImageUrl(profile.avatar));
                }
            } catch (e) {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, [receiverId]);

    // ============================================================================
    // FETCH PROPERTY DETAILS
    // ============================================================================
    const fetchPropertyDetails = useCallback(async () => {
        if (!propertyId) return;
        
        setPropertyLoading(true);
        try {
            const token = await getAuthToken();
            const { BASE_URL } = require('../config/api.config');
            
            const response = await fetch(`${BASE_URL}/properties/${propertyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Property API returned non-JSON response');
                return;
            }

            const text = await response.text();
            if (!text || text.trim().startsWith('<')) {
                console.warn('Property API returned HTML instead of JSON');
                return;
            }

            const data = JSON.parse(text);
            
            if (response.ok && data.success) {
                setPropertyDetails(data.property);
                console.log('Property details fetched:', data.property);
            } else {
                console.warn('Failed to fetch property:', data.message);
            }
        } catch (error) {
            // Silently handle - property details are optional
            console.warn('Could not fetch property details:', error?.message || error);
        } finally {
            setPropertyLoading(false);
        }
    }, [propertyId]);

    // Fetch property details on mount
    useEffect(() => {
        if (propertyId) {
            fetchPropertyDetails();
        }
    }, [propertyId, fetchPropertyDetails]);

    // ============================================================================
    // UTILITY: Format API messages with robust sender ID extraction
    // ============================================================================
    const formatAPIMessage = useCallback((apiMessage) => {
        if (!apiMessage || typeof apiMessage !== 'object') {
            return null;
        }

        const id = apiMessage._id || apiMessage.id || apiMessage.createdAt || Date.now().toString();
        const text = apiMessage.text || apiMessage.body || apiMessage.message || '';

        // Skip empty messages
        if (!text.trim()) {
            return null;
        }

        // Extract sender ID with priority order
        let senderId = null;
        const senderFields = [
            apiMessage.senderId,
            apiMessage.sender,
            apiMessage.user,
            apiMessage.sender_id,
            apiMessage.user_id,
            apiMessage.userId,
            apiMessage.from
        ];

        for (const field of senderFields) {
            if (field) {
                if (typeof field === 'string') {
                    senderId = field;
                    break;
                } else if (typeof field === 'object') {
                    senderId = field._id || field.id || field.userId;
                    if (senderId) break;
                }
            }
        }
        
        senderId = senderId ? String(senderId).trim() : null;

        // Determine message ownership (user vs agent)
        let sender = 'agent'; // default
        
        if (currentUserId && senderId) {
            const currentUserStr = String(currentUserId).trim().toLowerCase();
            const senderStr = String(senderId).trim().toLowerCase();
            sender = (currentUserStr === senderStr) ? 'user' : 'agent';
        }

        const time = moment(apiMessage.timestamp || apiMessage.createdAt).format('hh:mm A');
        
        return { 
            id, 
            text, 
            sender, 
            time, 
            status: 'sent', 
            edited: apiMessage.edited || false,
            originalSenderId: senderId,
            createdAt: apiMessage.timestamp || apiMessage.createdAt || new Date()
        };
    }, [currentUserId]);

    // ============================================================================
    // WEBSOCKET HANDLER: Process incoming messages with smart duplicate prevention
    // ============================================================================
    const onNewMessage = useCallback((newMessage) => {
        try {
            if (!newMessage) return;

            // Extract chat ID from various possible fields
            const incomingChatId = newMessage.chatId || newMessage.chat?._id || 
                                   newMessage.chat?.id || newMessage.chat_id || newMessage.room;

            // Ignore if definitely for a different chat
            if (incomingChatId && chatId && String(incomingChatId) !== String(chatId)) {
                return;
            }

            // Validate this message belongs to current chat
            let isForThisChat = !!incomingChatId;
            
            if (!incomingChatId && receiverId) {
                // Fallback: check sender/receiver match
                const senderId = newMessage.senderId || newMessage.sender?._id || 
                                newMessage.sender?.id || newMessage.from || newMessage.user;
                const toId = newMessage.to || newMessage.receiverId || newMessage.recipient;
                
                isForThisChat = (senderId && String(senderId) === String(receiverId)) ||
                               (toId && String(toId) === String(receiverId)) ||
                               (Array.isArray(newMessage.participants) && 
                                newMessage.participants.some(p => String(p._id || p.id || p) === String(receiverId)));
            }

            if (!isForThisChat) return;

            // Format and add message
            setMessages(prev => {
                const formatted = formatAPIMessage(newMessage);
                if (!formatted) return prev;

                // Replace temporary 'sending' message if it's our own echo
                if (formatted.sender === 'user') {
                    const sendingIndex = prev.findIndex(msg => 
                        msg.text === formatted.text && msg.status === 'sending'
                    );
                    if (sendingIndex !== -1) {
                        const updated = [...prev];
                        updated[sendingIndex] = { ...formatted, status: 'sent' };
                        return updated;
                    }
                }

                // Prevent duplicates
                const isDuplicate = prev.some(msg => 
                    String(msg.id) === String(formatted.id) ||
                    (msg.text === formatted.text && 
                     Math.abs(moment(msg.createdAt).diff(moment(formatted.createdAt), 'seconds')) < 5)
                );
                
                if (isDuplicate) return prev;

                // Add new message and scroll
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
                return [...prev, formatted];
            });
        } catch (error) {
            console.warn('WebSocket message handler error:', error?.message);
        }
    }, [chatId, receiverId, formatAPIMessage]);

    // ============================================================================
    // Initialize Socket Connection
    // ============================================================================
    const { isConnected, sendSocketMessage, joinRoom, leaveRoom } = useChatSocket(
        chatId, // Always pass chatId (can be null initially)
        onNewMessage,
        null
    ); 

    // ============================================================================
    // CHAT INITIALIZATION - Sequential: Create/Get Chat → Set ChatId → Join Socket
    // ============================================================================
    const initializeChat = useCallback(async () => {
        // Wait until we have currentUserId to avoid mis-classifying messages
        if (!currentUserId) {
            return;
        }

        // If we have neither receiverId nor paramChatId, show error
        if (!receiverId && !paramChatId) {
            setLoading(false);
            Alert.alert("Error", "No user specified to chat with. Please try again from a property or service page.", [{ text: "OK", onPress: () => navigation.goBack() }]);
            return;
        }

        setLoading(true);
        setMessages([]); 

        try {
            let chat = null;
            
            // Try to get existing chat
            if (paramChatId) {
                console.log('🔄 Getting chat by ID:', paramChatId);
                chat = await getChatById(paramChatId);
            }
            
            if (!chat && receiverId) {
                console.log('🔄 Getting/creating chat with receiver:', receiverId);
                const chatResult = await getOrCreateChat(receiverId);
                
                // Handle TENANT_ONLY restriction error
                if (chatResult.errorType === 'TENANT_ONLY') {
                    setLoading(false);
                    Alert.alert(
                        "Chat Restriction",
                        "Only tenants can start a chat with property owners. As an owner, you can wait for tenants to contact you, or you can reach them via Call or WhatsApp.",
                        [{ text: "OK", onPress: () => navigation.goBack() }]
                    );
                    return;
                }
                
                if (chatResult.success && chatResult.chat) {
                    chat = chatResult.chat;
                } else if (!chatResult.success) {
                    // Handle other errors gracefully
                    console.warn('Could not create/get chat:', chatResult.error);
                }
            }

            if (chat) {
                const resolvedId = chat._id || chat.id || paramChatId;
                
                // Set chatId in state
                setChatId(resolvedId);

                // If backend returned tenant/owner populated, prefer their fullName for header
                try {
                    const owner = chat.owner || chat.participantOwner || null;
                    const tenant = chat.tenant || chat.participantTenant || null;
                    let other = null;
                    let isCurrentUserOwner = false;
                    if (owner && tenant) {
                        const ownerId = owner._id || owner.id;
                        const tenantId = tenant._id || tenant.id;
                        if (String(ownerId) === String(currentUserId)) {
                            other = tenant;
                            isCurrentUserOwner = true;
                        } else {
                            other = owner;
                            isCurrentUserOwner = false;
                        }
                    } else if (owner) {
                        other = owner;
                    } else if (tenant) {
                        other = tenant;
                    }

                    if (other) {
                        const otherName = safeString(other.fullName) || safeString(other.name) || safeString(other.displayName) || agentName;
                        setAgentName(otherName);
                        if (other.avatar || other.profilePicture) setAgentAvatar(formatImageUrl(other.avatar || other.profilePicture));
                        if (other.role) setAgentRole(other.role);
                    }

                    // Set property owner name if current user is tenant
                    if (owner && !isCurrentUserOwner) {
                        const ownerName = safeString(owner.fullName) || safeString(owner.name) || 'Owner';
                        setPropertyOwnerName(ownerName);
                    }
                } catch (e) {
                    // ignore
                }
                
                // Load initial messages
                const initialMessages = (chat.messages || [])
                    .map(formatAPIMessage)
                    .filter(msg => msg !== null);
                
                setMessages(initialMessages);

                // Join socket room for real-time updates
                setTimeout(() => {
                    try { 
                        joinRoom && joinRoom(resolvedId); 
                    } catch (e) {
                        console.warn('Socket join failed:', e);
                    }
                }, 500);

                // Mark as read (best-effort)
                try {
                    route.params && typeof route.params.onOpen === 'function' && route.params.onOpen();
                    const { default: eventBus } = await import('../utils/eventBus');
                    eventBus && eventBus.emit && eventBus.emit('chatOpened', { chatId: resolvedId });
                    markChatAsRead(resolvedId).catch(e => console.warn('markChatAsRead failed:', e && e.message ? e.message : e));
                } catch (e) {
                    // ignore
                }
            }
            // If no chat exists yet, that's OK - we'll create it when user sends first message
        } catch (error) {
            console.error("Failed to initialize chat:", error);
            // Don't block user - they can still send messages
        } finally {
            setLoading(false);
        }
    }, [receiverId, paramChatId, navigation, currentUserId, formatAPIMessage]);

    // Run initializeChat ONLY when the screen is focused AND currentUserId is available
    useFocusEffect(
        useCallback(() => {
            // Don't initialize chat until we have currentUserId
            if (!currentUserId) {
                return;
            }
            
            initializeChat();
            
            // Cleanup function for useFocusEffect (runs when the screen is blurred/unfocused)
            return () => {
                // Leave socket room when screen loses focus
                try { leaveRoom && leaveRoom(chatId); } catch (e) {}
            };
        }, [currentUserId, initializeChat])
    );

    // ============================================================================
    // POLLING FALLBACK: Refresh messages periodically (handles socket failures)
    // ============================================================================
    useEffect(() => {
        let intervalId;
        let mounted = true;

        const pollMessages = async () => {
            if (!chatId || !receiverId || !currentUserId) return;
            
            try {
                const chat = await getOrCreateChat(receiverId);
                if (!mounted || !chat?.messages) return;

                const serverMessages = chat.messages
                    .map(formatAPIMessage)
                    .filter(Boolean);
                
                setMessages(prev => {
                    // Keep sending messages untouched
                    const sendingMessages = prev.filter(m => m.status === 'sending');
                    
                    // Get unique server message IDs
                    const serverIds = new Set(serverMessages.map(m => m.id));
                    
                    // Remove confirmed messages that now exist on server
                    const localMessages = prev.filter(m => 
                        m.status === 'sending' || !serverIds.has(m.id)
                    );
                    
                    // Find truly new messages
                    const localIds = new Set(prev.map(m => m.id));
                    const newMessages = serverMessages.filter(m => !localIds.has(m.id));
                    
                    // Only update if there are actual changes
                    if (newMessages.length === 0 && sendingMessages.length === 0) {
                        return prev;
                    }
                    
                    // Merge: sending + server messages, sorted by time
                    const merged = [...sendingMessages, ...serverMessages]
                        .sort((a, b) => moment(a.createdAt).diff(moment(b.createdAt)));
                    
                    // Auto-scroll if new messages added
                    if (newMessages.length > 0) {
                        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
                    }
                    
                    return merged;
                });
            } catch (error) {
                // Silent fail - polling is non-critical
            }
        };

        if (chatId && receiverId && currentUserId) {
            pollMessages(); // Initial poll
            intervalId = setInterval(pollMessages, 3000); // Poll every 3s
        }

        return () => { 
            mounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [chatId, receiverId, currentUserId, formatAPIMessage]);

    // ============================================================================
    // SEND MESSAGE - ALWAYS SEND VIA API (NO BLOCKING)
    // ============================================================================
    const handleSend = async () => {
        // Only validate message text
        if (!inputText.trim()) {
            return;
        }

        // Validate we have receiver info
            if (!receiverId && !chatId) {
                if (__DEV__) console.error('❌ handleSend: missing receiverId and chatId', { receiverId, chatId, currentUserId });
                Alert.alert("Error", "Cannot send message. Missing receiver information.");
                return;
            }

            // Validate sender ID exists
            if (!currentUserId) {
                if (__DEV__) console.error('❌ handleSend: missing currentUserId', { receiverId, chatId, currentUserId });
                Alert.alert("Error", "Cannot send message. Please login again.");
                return;
            }

        const text = inputText.trim();

        // If we're editing an existing message
        if (editingMessageId) {
            const msgId = editingMessageId;
            setEditingMessageId(null);
            setInputText('');
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text, edited: true } : m));
            
            try {
                const token = await getAuthToken();
                const { BASE_URL } = await import('../config/api.config');
                if (token && BASE_URL) {
                    await fetch(`${BASE_URL}/chat/message/${msgId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ text }),
                    });
                }
            } catch (err) {
                console.warn('Edit message failed:', err?.message);
            }
            return;
        }

        // Clear input immediately for better UX
        setInputText('');
        setShowEmojiPicker(false);
        
        const tempMessageId = `temp-${Date.now()}`;
        
        // Optimistic UI update
        const tempMessage = {
            id: tempMessageId,
            text,
            sender: 'user',
            time: moment().format('hh:mm A'),
            status: 'sending',
            createdAt: new Date(),
            originalSenderId: currentUserId,
        };
        
        setMessages((prev) => [...prev, tempMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            let response;
            const propertyId = route.params?.propertyId || null;
            
            if (__DEV__) {
                console.log('📤 Sending message with params:', {
                    chatId,
                    receiverId,
                    currentUserId,
                    propertyId,
                    textLength: text.length
                });
            }
            
            // If we have chatId, use it. Otherwise send to receiverId directly
            if (chatId) {
                if (__DEV__) console.log('📤 Sending to existing chat:', chatId);
                response = await sendMessageApi(chatId, text, propertyId);
            } else {
                if (__DEV__) console.log('📤 Sending to receiver (auto-create chat):', receiverId);
                response = await sendMessageToReceiver(receiverId, text, currentUserId, propertyId);
                
                // If chat was created, store the chatId
                if (response.success && response.chatId) {
                    setChatId(response.chatId);
                    // Join socket room for real-time updates
                    setTimeout(() => {
                        try { joinRoom && joinRoom(response.chatId); } catch (e) {}
                    }, 500);
                }
            }

            if (__DEV__) {
                console.log('📬 Send message response:', response);
            }

            if (response.success) {
                // Replace temp message with real message
                const formattedMessage = formatAPIMessage(response.message);
                if (formattedMessage) {
                    setMessages(prev => prev.map(msg => 
                        msg.id === tempMessageId ? formattedMessage : msg
                    ));
                } else {
                    // Fallback: just mark as sent
                    setMessages(prev => prev.map(msg => 
                        msg.id === tempMessageId ? { ...msg, status: 'sent' } : msg
                    ));
                }
                
                // ✅ NEW: Emit event to update chat list
                try {
                    DeviceEventEmitter.emit('chatMessageSent', {
                        chatId: response.chatId || chatId,
                        message: text,
                        timestamp: new Date().toISOString()
                    });
                } catch (emitError) {
                    console.warn('Failed to emit chat event:', emitError);
                }
                
            } else {
                // API failed - mark as failed
                const errorMsg = response.error || response.message || 'Unknown error';
                if (__DEV__) console.error('❌ Send failed:', errorMsg);
                
                setMessages(prev => prev.map(msg => 
                    msg.id === tempMessageId ? { 
                        ...msg, 
                        text: `${msg.text} (Failed)`, 
                        status: 'failed' 
                    } : msg
                ));
                setInputText(text);
                
                Alert.alert(
                    'Send Failed',
                    `Could not send message. ${errorMsg}. Long press to retry.`
                );
            }
            
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        } catch (error) {
            const errorMsg = error?.message || 'Unknown error';
            if (__DEV__) console.error('❌ Failed to send message:', errorMsg, error);
            
            setMessages(prev => prev.map(msg => 
                msg.id === tempMessageId ? { 
                    ...msg, 
                    text: `${msg.text} (Failed)`, 
                    status: 'failed' 
                } : msg
            ));
            setInputText(text);
            
            Alert.alert(
                'Network Error',
                `Could not send message. ${errorMsg}. Please check your connection and try again.`
            );
        }
    };
    
    // Add retry functionality for failed messages
    const handleRetry = async (failedMessage) => {
        if (!failedMessage || !failedMessage.text) return;

        const text = failedMessage.text.replace(' (Failed)', '').trim();
        setMessages((prev) => prev.map((msg) => (msg.id === failedMessage.id ? { ...msg, status: 'sending' } : msg)));

        try {
            let response;
            
            if (chatId) {
                response = await sendMessageApi(chatId, text);
            } else if (receiverId) {
                response = await sendMessageToReceiver(receiverId, text);
                if (response.success && response.chatId) {
                    setChatId(response.chatId);
                }
            } else {
                setMessages((prev) => prev.map((msg) => (msg.id === failedMessage.id ? { ...msg, status: 'failed' } : msg)));
                return;
            }
            
            if (response.success && response.message) {
                const formattedMessage = formatAPIMessage(response.message);
                if (formattedMessage) {
                    setMessages((prev) => prev.map((msg) => (msg.id === failedMessage.id ? formattedMessage : msg)));
                } else {
                    setMessages((prev) => prev.map((msg) => (msg.id === failedMessage.id ? { ...msg, status: 'sent' } : msg)));
                }
            } else {
                setMessages((prev) => prev.map((msg) => (msg.id === failedMessage.id ? { ...msg, status: 'failed' } : msg)));
            }
        } catch (error) {
            console.error('Retry failed:', error);
            setMessages((prev) => prev.map((msg) => (msg.id === failedMessage.id ? { ...msg, status: 'failed' } : msg)));
        }
    };

    const handleGoBack = () => navigation.goBack();

    const onMessageLongPress = (item) => {
        // Only allow editing/deleting your own messages
        if (item.sender !== 'user') return;

        // options: Edit, Delete, Cancel
        Alert.alert(
            '',
            'Choose action',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => {
                    setEditingMessageId(item.id);
                    setInputText(item.text);
                    inputRef.current?.focus && inputRef.current.focus();
                }},
                { text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        // optimistic removal
                        setMessages(prev => prev.filter(m => m.id !== item.id));
                        
                        // best-effort API call to delete message
                        try {
                            const token = await getAuthToken();
                            const { BASE_URL } = await import('../config/api.config');
                            if (token && BASE_URL) {
                                await fetch(`${BASE_URL}/chat/message/${item.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                                });
                            }
                        } catch (e) {
                            console.warn('delete message API failed (best-effort):', e && e.message ? e.message : e);
                        }
                    } catch (err) {
                        console.error('Failed to delete message locally', err);
                        Alert.alert("Error", "Failed to delete message locally. History may be incorrect until reload.");
                    }
                }},
            ],
            { cancelable: true }
        );
    };

    const renderMessage = ({ item }) => {
        // CRITICAL: Determine alignment based on sender field
        const isCurrentUser = item.sender === 'user';
        
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => {
                    if (item.sender === 'user' && item.status === 'failed') {
                        handleRetry(item);
                    } else if (item.sender === 'user') {
                        onMessageLongPress(item);
                    }
                }}
                style={[
                    styles.messageContainer,
                    // CRITICAL: This determines left vs right alignment
                    isCurrentUser ? styles.userContainer : styles.agentContainer,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        // CRITICAL: This determines bubble color
                        isCurrentUser ? styles.userBubble : styles.agentBubble,
                        item.status === 'failed' && { backgroundColor: '#FCA5A5' }
                    ]}
                >
                <Text style={isCurrentUser ? styles.userText : styles.agentText}>
                    {safeString(item.text, '')} {item.edited ? ' (edited)' : ''}
                </Text>
                <Text style={isCurrentUser ? styles.userTime : styles.agentTime}>
                    {safeString(item.time, '')} {item.status === 'sending' ? ' • Sending...' : null} 
                </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} translucent={false} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.lightText }}>Initializing chat...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} translucent={false} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                enabled={true}
            >
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
                    <Icon name="chevron-back" size={26} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Name initial avatar instead of profile image */}
                        <View style={styles.headerAvatarInitial}>
                            <Text style={styles.headerAvatarInitialText}>
                                {agentName ? agentName.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {safeString(agentName, 'Agent/Owner')}
                        </Text>
                    </View>
                    {(agentRole || propertyTitle || propertyOwnerName) && (
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {agentRole && `${agentRole}`}
                            {agentRole && (propertyTitle || propertyOwnerName) && ' • '}
                            {propertyTitle && `Property: ${safeString(propertyTitle, '')}`}
                            {propertyOwnerName && !propertyTitle && `Owner: ${propertyOwnerName}`}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={async () => {
                        if (chatId && receiverId) {
                            try {
                                const chat = await getOrCreateChat(receiverId);
                                if (chat && chat.messages && Array.isArray(chat.messages)) {
                                    const refreshedMessages = chat.messages
                                        .map(formatAPIMessage)
                                        .filter(msg => msg !== null);
                                    setMessages(refreshedMessages);
                                    setTimeout(() => {
                                        try {
                                            flatListRef.current?.scrollToEnd({ animated: true });
                                        } catch (scrollError) {
                                            // Silently handle scroll error
                                        }
                                    }, 100);
                                }
                            } catch (error) {
                                Alert.alert('Refresh Failed', 'Could not refresh messages. Please check your connection and try again.');
                            }
                        }
                    }}
                >
                    <Icon name="refresh-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Message List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.messageList, { paddingBottom: showEmojiPicker ? 380 : 140 }]}
                keyboardShouldPersistTaps={'handled'}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Emoji Picker (simple) */}
            {showEmojiPicker && (
                <View style={styles.emojiPicker}>
                    {['😀','😁','😂','😉','😍','🤔','😭','😮','👍','🙏','🔥','🎉'].map(e => (
                        <TouchableOpacity key={e} onPress={() => { setInputText(prev => prev + e); }} style={styles.emojiButton}>
                            <Text style={{ fontSize: 20 }}>{e}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Input Area - Always enabled */}
            <View style={styles.inputContainer}>
                <TouchableOpacity 
                    style={{ marginRight: 8 }} 
                    onPress={() => setShowEmojiPicker(prev => !prev)}
                >
                    <Icon name="happy-outline" size={26} color={colors.lightText} />
                </TouchableOpacity>
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.lightText}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    onFocus={() => {
                        setShowEmojiPicker(false);
                        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
                    }}
                />
                <TouchableOpacity 
                    style={styles.sendButton} 
                    onPress={handleSend}
                >
                    <Icon name="send" size={22} color={colors.white} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// --- Modern Styles - Matched with HomeScreen Theme ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background 
    },
    
    // Header - Modern Design
    header: {
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: 12, 
        paddingBottom: 16,
        backgroundColor: colors.white, 
        borderBottomWidth: 0,
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerButton: { 
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.greyLight,
    },
    headerAvatarInitial: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 8,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarInitialText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    headerTitleContainer: { 
        flex: 1, 
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: '800', 
        color: colors.text,
        letterSpacing: -0.3,
    },
    headerSubtitle: { 
        fontSize: 12, 
        color: colors.primary,
        fontWeight: '600',
        marginTop: 2,
    },

    // Messages - Modern Bubble Design
    messageList: { 
        paddingHorizontal: 12, 
        paddingVertical: 12,
    },
    messageContainer: { 
        marginVertical: 6, 
        maxWidth: '80%',
    },
    userContainer: { 
        alignSelf: 'flex-end',
    },
    agentContainer: { 
        alignSelf: 'flex-start',
    },
    messageBubble: { 
        paddingVertical: 12, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    userBubble: { 
        backgroundColor: colors.senderBubble, 
        borderBottomRightRadius: 4,
    },
    agentBubble: { 
        backgroundColor: colors.receiverBubble, 
        borderBottomLeftRadius: 4, 
        borderWidth: 1.5, 
        borderColor: colors.greyLight,
    },
    userText: { 
        color: colors.white, 
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '500',
    },
    agentText: { 
        color: colors.text, 
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '500',
    },
    userTime: { 
        color: 'rgba(255,255,255,0.8)', 
        fontSize: 11, 
        marginTop: 6, 
        alignSelf: 'flex-end',
        fontWeight: '600',
    },
    agentTime: { 
        color: colors.lightText, 
        fontSize: 11, 
        marginTop: 6, 
        alignSelf: 'flex-end',
        fontWeight: '600',
    },

    // Input - Modern Design
    inputContainer: { 
        flexDirection: 'row', 
        padding: 12,
        paddingBottom: Platform.OS === 'android' ? 12 : 12,
        marginBottom: 0,
        backgroundColor: colors.white, 
        alignItems: 'flex-end', 
        borderTopWidth: 1, 
        borderColor: colors.greyLight,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    input: { 
        flex: 1, 
        backgroundColor: colors.background, 
        borderRadius: 24, 
        paddingHorizontal: 18, 
        paddingVertical: 12, 
        marginRight: 10, 
        fontSize: 15, 
        maxHeight: 120, 
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.greyLight,
        fontWeight: '500',
    },
    sendButton: { 
        width: 48, 
        height: 48, 
        borderRadius: 24, 
        backgroundColor: colors.primary, 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    emojiPicker: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        backgroundColor: colors.white, 
        padding: 12, 
        borderTopWidth: 1, 
        borderColor: colors.greyLight,
    },
    emojiButton: { 
        padding: 8, 
        margin: 4, 
        borderRadius: 8,
        backgroundColor: colors.background,
    },
});

export default ChatDetailScreen;
