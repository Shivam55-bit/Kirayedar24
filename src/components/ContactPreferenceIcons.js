import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * ContactPreferenceIcons - Conditionally renders contact icons based on preferences
 * Same logic as PropertyDetailsScreen - shows icons by default unless explicitly false
 * 
 * @param {Object} contactPreferences - { phone: boolean, whatsapp: boolean, chat: boolean }
 * @param {Function} onPhonePress - Callback when phone icon is pressed
 * @param {Function} onWhatsAppPress - Callback when WhatsApp icon is pressed
 * @param {Function} onChatPress - Callback when chat icon is pressed
 * @param {number} iconSize - Size of icons (default: 14)
 * @param {number} buttonSize - Size of button container (default: 28)
 * @param {Object} containerStyle - Additional styles for the container
 */
const ContactPreferenceIcons = memo(({
  contactPreferences,
  onPhonePress,
  onWhatsAppPress,
  onChatPress,
  iconSize = 14,
  buttonSize = 28,
  containerStyle,
}) => {
  // Same logic as PropertyDetailsScreen:
  // Show icon by default UNLESS explicitly set to false or 'false'
  const showPhone = contactPreferences?.phone !== false && contactPreferences?.phone !== 'false';
  const showWhatsapp = contactPreferences?.whatsapp !== false && contactPreferences?.whatsapp !== 'false';
  const showChat = contactPreferences?.chat !== false && contactPreferences?.chat !== 'false';

  // Check if at least one icon should be shown
  const hasAnyPreference = showPhone || showWhatsapp || showChat;

  // Don't render container if no icons to show
  if (!hasAnyPreference) return null;

  // Dynamic button style based on buttonSize
  const dynamicButtonStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {showPhone && (
        <TouchableOpacity
          style={[styles.actionButton, styles.phoneButton, dynamicButtonStyle]}
          onPress={onPhonePress}
          activeOpacity={0.7}
        >
          <Icon name="call" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {showWhatsapp && (
        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton, dynamicButtonStyle]}
          onPress={onWhatsAppPress}
          activeOpacity={0.7}
        >
          <Icon name="logo-whatsapp" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {showChat && (
        <TouchableOpacity
          style={[styles.actionButton, styles.chatButton, dynamicButtonStyle]}
          onPress={onChatPress}
          activeOpacity={0.7}
        >
          <Icon name="chatbubble-outline" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  phoneButton: {
    backgroundColor: '#FDB022', // Primary orange
  },
  whatsappButton: {
    backgroundColor: '#25D366', // WhatsApp green
  },
  chatButton: {
    backgroundColor: '#6B7280', // Gray for chat
  },
});

export default ContactPreferenceIcons;
