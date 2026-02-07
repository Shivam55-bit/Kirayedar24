import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const NoPackageModal = ({
  visible,
  onClose,
  onBuyPackage,
  onMaybeLater,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient colors={['#f39c12', '#e67e22']} style={styles.header}>
            <View style={styles.headerContent}>
              <Icon name="alert-circle" size={40} color="#fff" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>No Active Package</Text>
                <Text style={styles.headerSubtitle}>Get started with a package today</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Main Message */}
            <View style={styles.messageSection}>
              <Icon name="information-circle" size={48} color="#f39c12" />
              <Text style={styles.messageTitle}>Start Posting Properties</Text>
              <Text style={styles.messageText}>
                You need an active subscription package to post properties and reach thousands of potential buyers and tenants.
              </Text>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefitsSection}>
              <Text style={styles.sectionTitle}>What You'll Get:</Text>
              <View style={styles.benefitsList}>
                <BenefitRow icon="checkmark-circle" text="Post unlimited properties" />
                <BenefitRow icon="checkmark-circle" text="Reach thousands of buyers" />
                <BenefitRow icon="checkmark-circle" text="Get instant notifications" />
                <BenefitRow icon="checkmark-circle" text="Priority visibility" />
                <BenefitRow icon="checkmark-circle" text="24/7 customer support" />
              </View>
            </View>

            {/* Next Steps Section */}
            <View style={styles.stepsSection}>
              <Text style={styles.sectionTitle}>How It Works:</Text>
              <StepRow number="1" text="Choose a package that fits your needs" />
              <StepRow number="2" text="Complete the secure payment" />
              <StepRow number="3" text="Start posting properties immediately" />
            </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Icon name="bulb" size={20} color="#f39c12" />
              <Text style={styles.infoText}>
                Special offer: Get your first package at a discounted rate!
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => onMaybeLater ? onMaybeLater() : onClose()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buyButton}
              onPress={onBuyPackage}
              activeOpacity={0.8}
            >
              <Icon name="bag" size={20} color="#fff" />
              <Text style={styles.buyButtonText}>Buy Package</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const BenefitRow = ({ icon, text }) => (
  <View style={styles.benefitRow}>
    <Icon name={icon} size={20} color="#27ae60" />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const StepRow = ({ number, text }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 28,
    maxHeight: '75%',
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingVertical: 20,
    backgroundColor: '#fff8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  benefitsSection: {
    marginBottom: 24,
  },
  stepsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
  },
  benefitsList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#d97706',
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f39c12',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default NoPackageModal;
