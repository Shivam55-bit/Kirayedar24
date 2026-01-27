/**
 * ChatListScreen - Production Ready
 * Displays all user chats with real-time updates
 * 
 * Features:
 * - Fetch all chats on mount
 * - Real-time message updates via WebSocket
 * - Pull-to-refresh
 * - Swipe-to-delete
 * - Sorted by latest message
 * - Unread count badges
 * - Empty state
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  DeviceEventEmitter,
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// Components & Services
import ChatItem from '../components/ChatItem';
import { getUserChats, deleteChat, deleteAllChats, getCurrentUserId } from '../services/chatApi';
import useChatSocket from '../hooks/useChatSocket';

// Colors
const colors = {
  primary: '#FDB022',
  primaryLight: '#FDBF4D',
  primaryDark: '#E89E0F',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1E293B',
  lightText: '#64748B',
  border: '#E5E7EB',
  unread: '#EF4444',
};

const ChatListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deletingChatIds, setDeletingChatIds] = useState(new Set());

  // Get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    };
    fetchUserId();
  }, []);

  // Fetch chats
  const fetchChats = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      
      const result = await getUserChats();
      
      if (result.success) {
        setChats(result.chats || []);
      } else {
        console.error('Failed to fetch chats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChats(false);
    }, [])
  );

  // Real-time updates via WebSocket
  const handleNewMessage = useCallback((data) => {
    if (__DEV__) console.log('📨 New message in ChatListScreen:', data);
    
    // Update chat list with new message
    setChats(prevChats => {
      const chatId = data.chatId || data.chat?._id;
      if (!chatId) return prevChats;

      const existingChatIndex = prevChats.findIndex(chat => chat._id === chatId);
      
      if (existingChatIndex !== -1) {
        // Update existing chat
        const updatedChats = [...prevChats];
        const chat = updatedChats[existingChatIndex];
        
        updatedChats[existingChatIndex] = {
          ...chat,
          lastMessage: {
            text: data.text || data.message?.text,
            sender: data.sender || data.message?.sender,
            timestamp: data.timestamp || data.message?.timestamp || new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
          unreadCount: data.sender !== currentUserId 
            ? (chat.unreadCount || 0) + 1 
            : chat.unreadCount,
        };

        // Sort by latest
        return updatedChats.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      } else {
        // New chat - refetch to get full data
        fetchChats(false);
        return prevChats;
      }
    });
  }, [currentUserId]);

  // ✅ NEW: Listen for message sent events to update chat list
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('chatMessageSent', (data) => {
      if (__DEV__) console.log('📨 Message sent event received:', data);
      // Refetch chats to update list
      fetchChats(false);
    });
    
    return () => subscription.remove();
  }, []);

  // Initialize WebSocket (null chatId = listen to all chats)
  useChatSocket(null, handleNewMessage, null);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchChats(false);
  };

  // Navigate to chat detail
  const handleChatPress = (chat) => {
    // Derive the other participant (not the current user) and pass it as `user`
    const participants = chat.participants || [];
    let otherParticipant = null;

    for (const p of participants) {
      const pId = p?._id || p?.id || p;
      if (String(pId) !== String(currentUserId)) {
        otherParticipant = (typeof p === 'object') ? p : { _id: pId, id: pId };
        break;
      }
    }

    if (!otherParticipant && participants.length > 0) {
      const p = participants[0];
      otherParticipant = (typeof p === 'object') ? p : { _id: p, id: p };
    }

    navigation.navigate('ChatDetailScreen', {
      chatId: chat._id,
      user: otherParticipant,
      propertyTitle: chat.propertyTitle || chat.property?.title || 'Property',
      propertyId: chat.propertyId || chat.property?._id,
    });
  };

  // Show Toast (cross-platform)
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  // Delete single chat
  const handleDeleteChat = (chat) => {
    // Double-delete protection
    if (deletingChatIds.has(chat._id)) {
      console.log('⚠️ Chat already being deleted:', chat._id);
      return;
    }

    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Mark as deleting
              setDeletingChatIds(prev => new Set(prev).add(chat._id));

              // Optimistic UI update
              setChats(prevChats => prevChats.filter(c => c._id !== chat._id));

              const result = await deleteChat(chat._id);
              
              if (result.success) {
                showToast(result.message || 'Chat deleted successfully');
              } else {
                // Revert on failure
                showToast(result.error || 'Failed to delete chat');
                fetchChats(false); // Refetch to restore
              }
            } catch (error) {
              console.error('Delete chat error:', error);
              showToast('Network error. Please try again.');
              fetchChats(false); // Refetch to restore
            } finally {
              // Remove from deleting set
              setDeletingChatIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(chat._id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  // Delete all chats
  const handleDeleteAllChats = () => {
    if (chats.length === 0) {
      showToast('No chats to delete');
      return;
    }

    Alert.alert(
      'Delete All Chats',
      `Are you sure you want to delete all ${chats.length} chats? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setMenuVisible(false);
              setLoading(true);

              const result = await deleteAllChats();
              
              if (result.success) {
                setChats([]);
                showToast(result.message || 'All chats deleted successfully');
              } else {
                showToast(result.error || 'Failed to delete all chats');
              }
            } catch (error) {
              console.error('Delete all chats error:', error);
              showToast('Network error. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="chatbubbles-outline" size={80} color={colors.lightText} />
        <Text style={styles.emptyTitle}>No Chats Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start a conversation by clicking "Chat" on any property
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.browseButtonText}>Browse Properties</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render chat item
  const renderChatItem = ({ item }) => (
    <ChatItem
      chat={item}
      onPress={handleChatPress}
      onDelete={handleDeleteChat}
      currentUserId={currentUserId}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Chats</Text>
        
        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Icon name="ellipsis-vertical" size={24} color={colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Custom Dropdown Menu */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteAllChats}
            >
              <Icon name="trash-outline" size={20} color={colors.unread} />
              <Text style={styles.menuItemText}>Delete All Chats</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Chat List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Loading chats...</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={chats.length === 0 ? styles.emptyList : null}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  menuButton: {
    padding: 4,
  },
  menuContent: {
    backgroundColor: colors.white,
    marginTop: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.lightText,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.lightText,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuDropdown: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginTop: 60,
    marginRight: 16,
    paddingVertical: 8,
    minWidth: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: colors.unread,
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default ChatListScreen;
