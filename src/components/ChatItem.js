/**
 * ChatItem Component
 * Displays individual chat preview in ChatListScreen
 * 
 * Shows:
 * - Owner profile picture
 * - Owner name
 * - Property title
 * - Last message preview
 * - Timestamp
 * - Unread count badge
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

const colors = {
  primary: '#FDB022',
  white: '#FFFFFF',
  text: '#1E293B',
  lightText: '#64748B',
  unread: '#EF4444',
  greyLight: '#E2E8F0',
  border: '#E5E7EB',
};

const ChatItem = ({ chat, onPress, onDelete, currentUserId }) => {
  // Extract other participant from chat.owner/tenant (backend populated)
  let otherParticipant = null;
  let participantRole = null;
  
  const owner = chat.owner || null;
  const tenant = chat.tenant || null;
  
  if (owner && tenant) {
    const ownerId = owner._id || owner.id;
    const tenantId = tenant._id || tenant.id;
    if (String(ownerId) === String(currentUserId)) {
      otherParticipant = tenant;
      participantRole = tenant.role || 'Tenant';
    } else {
      otherParticipant = owner;
      participantRole = owner.role || 'Owner';
    }
  } else if (owner) {
    otherParticipant = owner;
    participantRole = owner.role || 'Owner';
  } else if (tenant) {
    otherParticipant = tenant;
    participantRole = tenant.role || 'Tenant';
  } else {
    // Fallback to participants array
    const participants = chat.participants || [];
    otherParticipant = participants.find(
      p => p?._id?.toString() !== currentUserId?.toString() && p?.id?.toString() !== currentUserId?.toString()
    ) || participants[0] || {};
  }
  
  // Try multiple field name variations for participant name
  const participantName = otherParticipant?.fullName 
    || otherParticipant?.name 
    || otherParticipant?.firstName 
    || (otherParticipant?.firstName && otherParticipant?.lastName 
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}` 
        : null)
    || chat.ownerName
    || 'User';
    
  const participantImage = otherParticipant?.profilePicture 
    || otherParticipant?.avatar 
    || otherParticipant?.image 
    || null;
  
  // Property info
  const propertyTitle = chat.propertyTitle || 'Property';
  
  // Last message - extract from lastMessage object or messages array
  let lastMessage = 'Tap to start chatting';
  
  if (chat.lastMessage?.text) {
    lastMessage = chat.lastMessage.text;
  } else if (chat.lastMessage?.content) {
    lastMessage = chat.lastMessage.content;
  } else if (chat.lastMessage?.message) {
    lastMessage = chat.lastMessage.message;
  } else if (chat.messages && chat.messages.length > 0) {
    const lastMsg = chat.messages[chat.messages.length - 1];
    lastMessage = lastMsg?.text || lastMsg?.content || lastMsg?.message || lastMessage;
  }
  
  const timestamp = chat.updatedAt || chat.createdAt;
  
  // Unread count
  const unreadCount = chat.unreadCount || 0;

  // Format timestamp
  const formatTimestamp = (time) => {
    if (!time) return '';
    
    const messageDate = moment(time);
    const now = moment();
    
    // If today, show time
    if (messageDate.isSame(now, 'day')) {
      return messageDate.format('h:mm A');
    }
    
    // If yesterday
    if (messageDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    }
    
    // If this week
    if (messageDate.isSame(now, 'week')) {
      return messageDate.format('ddd');
    }
    
    // If this year
    if (messageDate.isSame(now, 'year')) {
      return messageDate.format('MMM D');
    }
    
    // Older
    return messageDate.format('MMM D, YYYY');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(chat)}
      onLongPress={() => onDelete && onDelete(chat)}
      activeOpacity={0.7}
    >
      {/* Profile Picture */}
      <View style={styles.avatarContainer}>
        {participantImage ? (
          <Image
            source={{ uri: participantImage }}
            style={styles.avatar}
            defaultSource={require('../assets/icon-placeholder.js')}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Icon name="person" size={24} color={colors.lightText} />
          </View>
        )}
      </View>

      {/* Chat Content */}
      <View style={styles.content}>
        {/* Participant Name & Role */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={styles.ownerName} numberOfLines={1}>
            {participantName}
          </Text>
          {participantRole && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{participantRole}</Text>
            </View>
          )}
        </View>

        {/* Property Title */}
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {propertyTitle}
        </Text>

        {/* Last Message */}
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>

      {/* Right Side - Timestamp & Badge */}
      <View style={styles.rightContent}>
        {/* Timestamp */}
        <Text style={styles.timestamp}>
          {formatTimestamp(timestamp)}
        </Text>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: colors.greyLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },
  propertyTitle: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.lightText,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.lightText,
    marginBottom: 8,
  },
  unreadBadge: {
    backgroundColor: colors.unread,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ChatItem;
