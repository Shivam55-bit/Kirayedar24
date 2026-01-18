import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const TermsScreen = ({ navigation, route }) => {
  const [accepted, setAccepted] = useState(false);
  
  // Safely get onAccept callback
  const onAccept = route?.params?.onAccept;

  const handleAccept = () => {
    if (accepted && onAccept) {
      onAccept();
      navigation.goBack();
    }
  };

  const termsContent = `TERMS & CONDITIONS

Last Updated: January 15, 2026

Welcome to Kirayedar24! By using our platform, you agree to these terms.

1. ACCEPTANCE OF TERMS
By accessing and using Kirayedar24, you accept and agree to be bound by the terms of this agreement.

2. USER REGISTRATION
• You must provide accurate information
• You are responsible for maintaining account security
• Users must be 18 years or older
• One account per user

3. PROPERTY LISTINGS
• All listings must be genuine and accurate
• False information may result in account termination
• Property owners must have legal rights to list properties

4. BOOKING & PAYMENTS
• All bookings are subject to availability
• Payment terms are final and non-refundable unless specified
• Cancellation policies apply as per property terms

5. USER CONDUCT
You agree NOT to:
• Post false or misleading information
• Harass or harm other users
• Violate any laws or regulations
• Use the platform for illegal activities

6. PRIVACY & DATA
• We collect and process data as per our Privacy Policy
• Your data is protected and not shared without consent
• We use cookies for better user experience

7. INTELLECTUAL PROPERTY
• All content on Kirayedar24 is owned by us
• Unauthorized use is prohibited
• Trademarks and logos are protected

8. LIMITATION OF LIABILITY
• Kirayedar24 acts as a platform only
• We are not responsible for disputes between users
• Use the platform at your own risk

9. MODIFICATIONS
We reserve the right to modify these terms at any time. Continued use constitutes acceptance.

10. CONTACT
For questions, contact us at:
Email: support@kirayedar24.com
Website: https://kirayedar24.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIVACY POLICY

Last Updated: January 15, 2026

At Kirayedar24, we value your privacy and are committed to protecting your personal information.

1. INFORMATION WE COLLECT
• Name, email, phone number
• Location data for property searches
• Payment information (securely processed)
• Device information and IP address
• Usage data and preferences

2. HOW WE USE YOUR INFORMATION
• To provide and improve our services
• To process bookings and payments
• To communicate updates and offers
• To personalize user experience
• To prevent fraud and ensure security

3. INFORMATION SHARING
We DO NOT sell your personal data. We share only when:
• Required by law
• With your explicit consent
• With service providers (payment processors, etc.)
• To protect our rights and safety

4. DATA SECURITY
• We use encryption and secure servers
• Regular security audits
• Limited employee access
• Secure payment gateways

5. YOUR RIGHTS
You have the right to:
• Access your personal data
• Correct inaccurate information
• Request data deletion
• Opt-out of marketing communications
• Withdraw consent anytime

6. COOKIES & TRACKING
• We use cookies for functionality
• Analytics to improve services
• You can disable cookies in settings

7. THIRD-PARTY SERVICES
• We use Google Maps for location
• Payment gateways for transactions
• Analytics tools for insights

8. CHILDREN'S PRIVACY
Our service is not intended for users under 18. We do not knowingly collect data from children.

9. DATA RETENTION
We retain data as long as necessary for services or as required by law.

10. INTERNATIONAL TRANSFERS
Your data may be transferred and stored globally, with appropriate safeguards.

11. CHANGES TO POLICY
We may update this policy. Continued use means acceptance.

12. CONTACT US
For privacy concerns:
Email: privacy@kirayedar24.com
Website: https://kirayedar24.com`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f39c12" />
      
      {/* Header */}
      <LinearGradient
        colors={['#f39c12', '#d35400']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Terms & Privacy Policy</Text>
        
        <View style={styles.backButton} />
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.contentText}>{termsContent}</Text>
      </ScrollView>

      {/* Bottom Acceptance */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && (
              <Icon name="checkmark" size={18} color="#fff" />
            )}
          </View>
          <Text style={styles.checkboxText}>
            I accept the Terms & Conditions and Privacy Policy
          </Text>
        </TouchableOpacity>

        {/* Accept Button */}
        <LinearGradient
          colors={accepted ? ['#10B981', '#059669'] : ['#D1D5DB', '#9CA3AF']}
          style={[styles.acceptButton, !accepted && styles.buttonDisabled]}
        >
          <TouchableOpacity
            style={styles.acceptButtonInner}
            onPress={handleAccept}
            disabled={!accepted}
            activeOpacity={0.8}
          >
            {!accepted && (
              <Icon name="lock-closed" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.acceptButtonText}>
              {accepted ? 'Agree & Continue' : 'Please Accept to Continue'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

export default TermsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 18,
    paddingHorizontal: 20,
    elevation: 8,
  },
  
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    textAlign: 'left',
  },
  
  bottomContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 10,
  },
  
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#f39c12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  
  checkboxChecked: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12',
  },
  
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
  },
  
  acceptButton: {
    borderRadius: 12,
    elevation: 4,
  },
  
  acceptButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  
  buttonDisabled: {
    elevation: 0,
  },
});
