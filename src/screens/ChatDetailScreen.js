// src/screens/ChatDetailScreen.js
// 
// 🧠 Optimized ChatDetailScreen - Production Ready
// ✅ Real-time WebSocket chat with polling fallback
// ✅ Clean message alignment (sender right, receiver left)
// ✅ Edit & delete messages with optimistic updates
// ✅ Smart duplicate prevention and message merging
// ✅ Auto-scroll behavior with proper timing
// ✅ Error handling with graceful degradation
// ✅ Modern UI with smooth animations

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
    Image,
    Alert,
    ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment'; 
import { useFocusEffect } from '@react-navigation/native'; 

// --- IMPORTS ---
// API services removed - chat functionality disabled
// import { getOrCreateChat, getChatById, sendMessageApi, getAuthToken, markChatAsRead, getCurrentUserId } from '../services/chatApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getUserProfile } from '../services/userapi';
// import { formatImageUrl } from '../services/homeApi';
import useChatSocket from '../hooks/useChatSocket';
// import { sendChatMessageNotification } from '../services/chatNotificationService';
// -------------------

// --- COLORS PALETTE - Matched with HomeScreen Theme ---
const colors = {
    primary: '#FDB022',
    primaryLight: '#FDBF4D',
    primaryDark: '#E89E0F',
    accent: '#FDB022',
    background: '#F8FAFC',
    text: '#1E293B',
    lightText: '#64748B',
    white: '#FFFFFF',
    senderBubble: '#FDB022',
    receiverBubble: '#FFFFFF',
    greyLight: '#E2E8F0',
};

const ChatDetailScreen = ({ navigation, route }) => {
    // route.params is where 'user' (the agent/owner), 'chatId' and 'propertyTitle' are passed
    const { user, propertyTitle, chatId: paramChatId } = route.params || {}; 
    
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    const [currentUserId, setCurrentUserId] = useState(null);

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
    const [chatId, setChatId] = useState(paramChatId || null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const inputRef = useRef();
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef();

    // Robustly determine receiverId
    const receiverId = 
        user?._id || user?.userId || user?.postedBy?._id || 
        (typeof user === 'string' ? user : null); 
    
    const initialAgentName = user?.fullName || user?.name || user?.username || 'Agent/Owner';
    const [agentName, setAgentName] = useState(initialAgentName);
    const initialAgentAvatar = user?.avatar || user?.profilePic || null;
    const [agentAvatar, setAgentAvatar] = useState(initialAgentAvatar ? formatImageUrl(initialAgentAvatar) : null);

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
                const friendly = profile.fullName || profile.full_name || profile.name || profile.displayName || profile.email || agentName;
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

    // 2. Initialize Socket Connection
    const { isConnected, sendSocketMessage, joinRoom, leaveRoom } = useChatSocket(chatId, onNewMessage); 


    // 3. Data Fetching (Get/Create Chat) - MOVED TO useFocusEffect
    const initializeChat = useCallback(async () => {
        // Wait until we have currentUserId to avoid mis-classifying messages
        if (!currentUserId) {
            return;
        }

        if (!receiverId && !paramChatId) {
            setLoading(false);
            Alert.alert("Error", "No user specified to chat with. Please try again from a property or service page.", [{ text: "OK", onPress: () => navigation.goBack() }]);
            return;
        }

        setLoading(true);
        // Clear messages only when a new chat load begins
        setMessages([]); 

        try {
            let chat = null;
            
            // Always try getOrCreateChat first as it's more reliable for getting full chat history
            if (receiverId) {
                console.log('🔄 Getting full chat history via getOrCreateChat...');
                chat = await getOrCreateChat(receiverId);
            }
            
            // Fallback to getChatById only if getOrCreateChat failed and we have paramChatId
            if (!chat && paramChatId) {
                console.log('🔄 Fallback: Getting chat by ID...');
                chat = await getChatById(paramChatId);
            }

            if (chat) {
                const resolvedId = chat._id || chat.id || paramChatId;
                setChatId(resolvedId);
                const initialMessages = (chat.messages || [])
                    .map(formatAPIMessage)
                    .filter(msg => msg !== null);
                
                setMessages(initialMessages);

                try { joinRoom && joinRoom(resolvedId); } catch (e) {}

                // Mark chat as read (best-effort)
                try {
                    route.params && typeof route.params.onOpen === 'function' && route.params.onOpen();
                    const { default: eventBus } = await import('../utils/eventBus');
                    eventBus && eventBus.emit && eventBus.emit('chatOpened', { chatId: resolvedId });
                    markChatAsRead(resolvedId).catch(e => console.warn('markChatAsRead failed:', e && e.message ? e.message : e));
                } catch (e) {
                    // ignore
                }
            }
        } catch (error) {
            console.error("Failed to initialize chat:", error);
            Alert.alert("Error", "Could not load chat history. Check your network or permissions.");
        } finally {
            setLoading(false);
        }
    }, [receiverId, paramChatId, navigation, currentUserId]);


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
                // Ask the socket to leave the room when user leaves the screen
                try { leaveRoom && leaveRoom(chatId); } catch (e) {}
            };
        }, [initializeChat, currentUserId])
    );

    // Additional effect to refresh messages when screen becomes focused (with error handling)
    useFocusEffect(
        useCallback(() => {
            const refreshOnFocus = async () => {
                if (chatId && currentUserId && receiverId) {
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
                                    // Silently handle scroll errors
                                }
                            }, 100);
                        }
                    } catch (error) {
                        // Silently handle refresh errors
                    }
                }
            };

            // Small delay to allow screen to fully focus
            const timeoutId = setTimeout(refreshOnFocus, 500);
            
            return () => {
                clearTimeout(timeoutId);
            };
        }, [chatId, currentUserId, receiverId])
    );


    // 2a. Auto-fix message alignment when currentUserId becomes available
    useEffect(() => {
        if (!currentUserId || messages.length === 0) return;
        
        // Re-classify messages based on originalSenderId
        setMessages(prev => prev.map(msg => {
            // Skip messages that are obviously correct (sending/failed are always user messages)
            if (msg.status === 'sending' || msg.status === 'failed') {
                return { ...msg, sender: 'user' }; // Ensure these are user messages
            }
            
            // Check if originalSenderId matches current user
            if (msg.originalSenderId && currentUserId) {
                const shouldBeUser = String(msg.originalSenderId).trim() === String(currentUserId).trim();
                const correctSender = shouldBeUser ? 'user' : 'agent';
                
                if (msg.sender !== correctSender) {
                    return { ...msg, sender: correctSender };
                }
            }
            
            return msg;
        }));
    }, [currentUserId, messages.length]);

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


    // 4. Send Logic (Prioritizes Socket, falls back to REST API)
    const handleSend = async () => {
        if (!inputText.trim()) {
            return; // Don't show error for empty messages, just ignore
        }
        
        if (!chatId) {
            Alert.alert("Chat Not Ready", "Please wait for the chat to initialize, or go back and try again.");
            return;
        }
        
        if (!currentUserId) {
            Alert.alert("Authentication Error", "Please log in again to send messages.");
            return;
        }

        const text = inputText.trim();

        // If we're editing an existing message
        if (editingMessageId) {
            const msgId = editingMessageId;
            setEditingMessageId(null);
            setInputText('');
            // Optimistically update locally
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text, edited: true } : m));
            // Best-effort API call to update message on server
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
                console.warn('Edit message API failed (best-effort):', err && err.message ? err.message : err);
            }
            return;
        }

        setInputText('');
        setShowEmojiPicker(false);
        const tempMessageId = `temp-${Date.now()}`;
        
        // Optimistic UI update - THIS MESSAGE SHOULD APPEAR ON RIGHT SIDE
        const tempMessage = {
            id: tempMessageId,
            text,
            sender: 'user', // CRITICAL: This makes YOUR message appear on RIGHT side
            time: moment().format('hh:mm A'),
            status: 'sending',
            createdAt: new Date(),
            originalSenderId: currentUserId, // Store current user ID for reference
        };
        
        setMessages((prev) => [...prev, tempMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

            try {
                // Try socket first if connected, then fallback to REST API
                let sent = false;
                
                if (isConnected && sendSocketMessage) {
                    sent = sendSocketMessage(text);
                }
                
                if (!sent) {
                    const sentMessage = await sendMessageApi(chatId, text);                // Replace the temporary message with the confirmed server message
                const formattedMessage = formatAPIMessage(sentMessage);
                if (formattedMessage) {
                    setMessages(prev => prev.map(msg => 
                        msg.id === tempMessageId ? formattedMessage : msg
                    ));
                }

                // Send push notification to receiver
                try {
                    const senderName = await AsyncStorage.getItem('userFullName') || 'Someone';
                    const receiverIdForNotif = receiverId || user?._id || user?.id;
                    
                    if (receiverIdForNotif && receiverIdForNotif !== currentUserId) {
                        await sendChatMessageNotification({
                            receiverId: receiverIdForNotif,
                            senderId: currentUserId,
                            senderName,
                            message: text,
                            chatId,
                            propertyId: propertyTitle || '',
                        });
                    }
                } catch (notifError) {
                    // Don't block message sending if notification fails
                }
            } else {
                // For socket messages, the server should echo back and we'll handle it in onNewMessage
            }
            
            // Ensure scroll to end after message is sent
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        } catch (error) {
            console.error('Failed to send message:', error);
            // Revert/mark as failed
            setMessages(prev => prev.map(msg => 
                msg.id === tempMessageId ? { ...msg, text: `${msg.text} (Failed)`, status: 'failed' } : msg
            ));
            setInputText(text); 
        }
    };
    
    // Add retry functionality for failed messages
    const handleRetry = async (failedMessage) => {
        if (!failedMessage || !failedMessage.text || !chatId) return;

        const text = failedMessage.text.replace(' (Failed)', '').trim();
        setMessages((prev) => prev.map((msg) => (msg.id === failedMessage.id ? { ...msg, status: 'sending' } : msg)));

        try {
            // Use REST API for retry since WebSocket is unreliable
            const sentMessage = await sendMessageApi(chatId, text);
            const formattedMessage = formatAPIMessage(sentMessage);
            if (formattedMessage) {
                setMessages((prev) => prev.map((msg) => (msg.id === failedMessage.id ? formattedMessage : msg)));
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
                    {item.text} {item.edited ? ' (edited)' : ''}
                </Text>
                <Text style={isCurrentUser ? styles.userTime : styles.agentTime}>
                    {item.time} {item.status === 'sending' ? ' • Sending...' : null} 
                </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.lightText }}>Starting chat...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            // use padding behavior on both platforms to reliably lift the input
            behavior={'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
                    <Icon name="chevron-back" size={26} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {agentAvatar ? (
                            <Image source={{ uri: agentAvatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }} />
                        ) : null}
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {agentName}
                        </Text>
                    </View>
                    {propertyTitle ? (
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            Property: {propertyTitle}
                        </Text>
                    ) : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isConnected ? '#10B981' : '#EF4444',
                            marginRight: 4
                        }} />
                        <Text style={{ fontSize: 10, color: colors.lightText }}>
                            {isConnected ? 'Connected' : 'Offline'}
                        </Text>
                    </View>
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
                        } else {
                            Alert.alert('Error', 'Chat not properly initialized. Please go back and try again.');
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
                keyExtractor={(item) => item.id.toString()} // Ensure key is a string
                contentContainerStyle={[styles.messageList, { paddingBottom: showEmojiPicker ? 260 : 120 }]}
                keyboardShouldPersistTaps={'handled'}
                showsVerticalScrollIndicator={false}
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

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <TouchableOpacity style={{ marginRight: 8 }} onPress={() => setShowEmojiPicker(prev => !prev)}>
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
                        setShowEmojiPicker(false); // Hide emoji picker on keyboard focus
                        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
                    }}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Icon name="send" size={22} color={colors.white} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        paddingTop: Platform.OS === 'ios' ? 50 : 20, 
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
        backgroundColor: colors.white, 
        alignItems: 'center', 
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