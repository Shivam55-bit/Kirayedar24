/**
 * useChatSocket Hook - Production Ready
 * Manages WebSocket connection for real-time chat
 * 
 * Features:
 * - Single socket instance (no duplicates)
 * - Auto authentication with JWT
 * - Auto reconnect on disconnect
 * - Proper cleanup on unmount
 * - Event listener management
 * 
 * Socket Events (from backend):
 * - newMessage: New message received
 * - messageRead: Message marked as read
 * - messageEdited: Message was edited
 * - messageDeleted: Message was deleted
 * - userTyping: Other user is typing
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config/api.config';
import { getAuthToken } from '../services/chatApi';
import { AppState } from 'react-native';

// Global socket instance to prevent duplicates
let globalSocket = null;
let socketRefCount = 0;

/**
 * Custom hook to manage chat socket connection
 * @param {string} chatId - Chat room ID to join
 * @param {function} onNewMessage - Callback when new message arrives
 * @param {function} onMessageUpdate - Callback when message is edited/deleted/read
 * @returns {object} { socket, isConnected, joinRoom, leaveRoom, emit }
 */
const useChatSocket = (chatId, onNewMessage, onMessageUpdate) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageUpdateRef = useRef(onMessageUpdate);
  const appStateRef = useRef(AppState.currentState);
  const currentChatIdRef = useRef(chatId);

  // Keep callbacks updated
  useEffect(() => { onNewMessageRef.current = onNewMessage; }, [onNewMessage]);
  useEffect(() => { onMessageUpdateRef.current = onMessageUpdate; }, [onMessageUpdate]);
  useEffect(() => { currentChatIdRef.current = chatId; }, [chatId]);

  // Initialize socket connection
  useEffect(() => {
    let mounted = true;
    socketRefCount++;

    const initSocket = async () => {
      try {
        // Validate socket URL
        if (!SOCKET_URL) {
          console.error('❌ SOCKET_URL not configured in api.config.js');
          setError('Socket URL not configured');
          return;
        }

        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          console.warn('⚠️ No auth token available for socket connection');
          setError('Authentication required');
          return;
        }

        // Reuse existing socket or create new one
        if (!globalSocket || !globalSocket.connected) {
          console.log('🔌 Initializing socket connection to:', SOCKET_URL);
          
          globalSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: { token },
            query: { token }
          });

          // Connection event handlers
          globalSocket.on('connect', () => {
            if (!mounted) return;
            console.log('✅ Socket connected successfully');
            setIsConnected(true);
            setError(null);

            // Auto-join chat room if chatId exists
            if (currentChatIdRef.current) {
              console.log('🔔 Auto-joining chat room:', currentChatIdRef.current);
              globalSocket.emit('joinChat', { chatId: currentChatIdRef.current });
            }
          });

          globalSocket.on('disconnect', (reason) => {
            if (!mounted) return;
            console.log('🔌 Socket disconnected:', reason);
            setIsConnected(false);
            
            if (reason === 'io server disconnect') {
              // Server disconnected, manually reconnect
              globalSocket.connect();
            }
          });

          globalSocket.on('connect_error', (err) => {
            if (!mounted) return;
            console.warn('❌ Socket connection error:', err.message);
            setIsConnected(false);
            setError(err.message);
          });

          globalSocket.on('error', (err) => {
            if (!mounted) return;
            console.error('❌ Socket error:', err);
            setError(err.message || 'Socket error');
          });

          // Message event handlers
          globalSocket.on('newMessage', (data) => {
            if (!mounted) return;
            console.log('📨 New message received:', data);
            if (onNewMessageRef.current) {
              onNewMessageRef.current(data);
            }
          });

          globalSocket.on('messageRead', (data) => {
            if (!mounted) return;
            console.log('📖 Message read:', data);
            if (onMessageUpdateRef.current) {
              onMessageUpdateRef.current({ type: 'read', data });
            }
          });

          globalSocket.on('messageEdited', (data) => {
            if (!mounted) return;
            console.log('✏️ Message edited:', data);
            if (onMessageUpdateRef.current) {
              onMessageUpdateRef.current({ type: 'edited', data });
            }
          });

          globalSocket.on('messageDeleted', (data) => {
            if (!mounted) return;
            console.log('🗑️ Message deleted:', data);
            if (onMessageUpdateRef.current) {
              onMessageUpdateRef.current({ type: 'deleted', data });
            }
          });

          globalSocket.on('userTyping', (data) => {
            if (!mounted) return;
            console.log('⌨️ User typing:', data);
            if (onMessageUpdateRef.current) {
              onMessageUpdateRef.current({ type: 'typing', data });
            }
          });
        } else {
          console.log('♻️ Reusing existing socket connection');
          setIsConnected(globalSocket.connected);
          
          // Join chat room if chatId exists
          if (chatId && globalSocket.connected) {
            console.log('🔔 Joining chat room:', chatId);
            globalSocket.emit('joinChat', { chatId });
          }
        }
      } catch (error) {
        console.error('❌ Socket initialization error:', error);
        setError(error.message);
      }
    };

    initSocket();

    // Handle app state changes (background/foreground)
    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - rejoin chat room
        console.log('📱 App came to foreground - rejoining chat');
        if (globalSocket && globalSocket.connected && currentChatIdRef.current) {
          globalSocket.emit('joinChat', { chatId: currentChatIdRef.current });
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      mounted = false;
      socketRefCount--;

      if (subscription?.remove) {
        subscription.remove();
      }

      // Only disconnect if no other components are using the socket
      if (socketRefCount === 0 && globalSocket) {
        console.log('🔌 Disconnecting socket (no more listeners)');
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, [chatId]);

  // Join a chat room
  const joinRoom = useCallback((roomChatId) => {
    if (globalSocket && globalSocket.connected) {
      console.log('🔔 Joining chat room:', roomChatId);
      globalSocket.emit('joinChat', { chatId: roomChatId });
      currentChatIdRef.current = roomChatId;
    } else {
      console.warn('⚠️ Cannot join room - socket not connected');
    }
  }, []);

  // Leave a chat room
  const leaveRoom = useCallback((roomChatId) => {
    if (globalSocket && globalSocket.connected) {
      console.log('👋 Leaving chat room:', roomChatId);
      globalSocket.emit('leaveChat', { chatId: roomChatId });
    }
  }, []);

  // Emit custom event
  const emit = useCallback((event, data) => {
    if (globalSocket && globalSocket.connected) {
      globalSocket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit - socket not connected');
    }
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((typing = true) => {
    if (globalSocket && globalSocket.connected && currentChatIdRef.current) {
      globalSocket.emit('typing', { 
        chatId: currentChatIdRef.current,
        typing 
      });
    }
  }, []);

  return {
    socket: globalSocket,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    emit,
    sendTypingIndicator
  };
};

export default useChatSocket;