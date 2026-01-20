/**
 * MessageBubble Component
 * Displays individual message in ChatDetailScreen
 * 
 * Features:
 * - Sender messages on right (orange)
 * - Receiver messages on left (white)
 * - Timestamps
 * - Long press menu (edit/delete for own messages)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Ionicons';

const colors = {
  primary: '#FDB022',
  senderBubble: '#FDB022',
  receiverBubble: '#FFFFFF',
  white: '#FFFFFF',
  text: '#1E293B',
  lightText: '#64748B',
  border: '#E5E7EB',
};

const MessageBubble = ({ 
  message, 
  isSender, 
  onLongPress,
  showTimestamp = true 
}) => {
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return moment(timestamp).format('h:mm A');
  };

  return (
    <View style={[styles.container, isSender ? styles.senderContainer : styles.receiverContainer]}>
      <TouchableOpacity
        onLongPress={() => onLongPress && onLongPress(message)}
        activeOpacity={0.8}
        style={[
          styles.bubble,
          isSender ? styles.senderBubble : styles.receiverBubble,
        ]}
      >
        {/* Message Text */}
        <Text style={[styles.messageText, isSender ? styles.senderText : styles.receiverText]}>
          {message.text}
        </Text>

        {/* Timestamp */}
        {showTimestamp && (
          <View style={styles.timestampContainer}>
            <Text style={[styles.timestamp, isSender ? styles.senderTimestamp : styles.receiverTimestamp]}>
              {formatTime(message.timestamp || message.createdAt)}
            </Text>
            
            {/* Edited indicator */}
            {message.edited && (
              <Text style={[styles.editedText, isSender ? styles.senderTimestamp : styles.receiverTimestamp]}>
                • edited
              </Text>
            )}

            {/* Read indicator (for sender only) */}
            {isSender && message.read && (
              <Icon 
                name="checkmark-done" 
                size={14} 
                color="rgba(255, 255, 255, 0.7)" 
                style={styles.readIcon}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  senderContainer: {
    alignItems: 'flex-end',
  },
  receiverContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  senderBubble: {
    backgroundColor: colors.senderBubble,
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: colors.receiverBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  senderText: {
    color: colors.white,
  },
  receiverText: {
    color: colors.text,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  senderTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receiverTimestamp: {
    color: colors.lightText,
  },
  editedText: {
    fontSize: 10,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  readIcon: {
    marginLeft: 4,
  },
});

export default MessageBubble;
