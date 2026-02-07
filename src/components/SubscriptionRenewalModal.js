import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getSubscriptionPackages } from '../services/api';

const SubscriptionRenewalModal = ({
  visible,
  onClose,
  onSelectPackage,
  onMaybeLater,
  expiredDate = null,
  daysExpired = 0,
}) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Load subscription packages when modal opens
  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await getSubscriptionPackages();
      const pkgs = res?.data?.packages || res?.packages || res?.data || [];
      if (Array.isArray(pkgs)) {
        setPackages(pkgs);
        setSelectedPackage(pkgs[0] || null);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = () => {
    if (selectedPackage) {
      onSelectPackage(selectedPackage);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Unknown';
    }
  };

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
          <LinearGradient colors={['#ff6b6b', '#ee5a6f']} style={styles.header}>
            <View style={styles.headerContent}>
              <Icon name="warning" size={32} color="#fff" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Package Expired</Text>
                <Text style={styles.headerSubtitle}>
                  {daysExpired > 0 
                    ? `Expired ${daysExpired} day${daysExpired > 1 ? 's' : ''} ago` 
                    : 'Renew your package to post properties'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Expiry Info */}
          {expiredDate && (
            <View style={styles.expiryInfo}>
              <View style={styles.infoRow}>
                <Icon name="calendar" size={18} color="#f39c12" />
                <Text style={styles.infoLabel}>Expired on:</Text>
                <Text style={styles.infoValue}>{formatDate(expiredDate)}</Text>
              </View>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Why Renew Section */}
            <View style={styles.whyRenewSection}>
              <Text style={styles.sectionTitle}>Benefits of Active Package:</Text>
              <View style={styles.benefitsList}>
                <BenefitRow icon="checkmark-circle" text="Post unlimited properties" />
                <BenefitRow icon="checkmark-circle" text="Reach thousands of buyers" />
                <BenefitRow icon="checkmark-circle" text="Get instant notifications" />
                <BenefitRow icon="checkmark-circle" text="Priority visibility" />
              </View>
            </View>

            {/* Packages Section */}
            <View style={styles.packagesSection}>
              <Text style={styles.sectionTitle}>Choose Your Package</Text>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#f39c12" />
                  <Text style={styles.loadingText}>Loading packages...</Text>
                </View>
              ) : packages.length > 0 ? (
                <View style={styles.packagesList}>
                  {packages.map((pkg) => (
                    <TouchableOpacity
                      key={pkg._id || pkg.id}
                      style={[
                        styles.packageCard,
                        selectedPackage?._id === pkg._id || selectedPackage?.id === pkg.id
                          ? styles.packageCardSelected
                          : null,
                      ]}
                      onPress={() => setSelectedPackage(pkg)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.packageHeader}>
                        <View style={styles.packageInfo}>
                          <Text style={styles.packageName}>{pkg.name || 'Package'}</Text>
                          {pkg.description && (
                            <Text style={styles.packageDesc}>{pkg.description}</Text>
                          )}
                        </View>
                        <Icon
                          name={
                            selectedPackage?._id === pkg._id || selectedPackage?.id === pkg.id
                              ? 'checkmark-circle'
                              : 'radio-button-off'
                          }
                          size={24}
                          color={
                            selectedPackage?._id === pkg._id || selectedPackage?.id === pkg.id
                              ? '#f39c12'
                              : '#ddd'
                          }
                        />
                      </View>
                      <View style={styles.packageFooter}>
                        <Text style={styles.packagePrice}>₹{pkg.price || pkg.amount || 0}</Text>
                        {pkg.validity && (
                          <Text style={styles.packageValidity}>{pkg.validity}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Icon name="alert-circle" size={40} color="#ccc" />
                  <Text style={styles.emptyText}>No packages available</Text>
                </View>
              )}
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <Icon name="information-circle" size={20} color="#3498db" />
              <Text style={styles.infoText}>
                Your package has expired. Renew it now to continue posting properties and reaching potential buyers/tenants.
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.renewButton,
                !selectedPackage && styles.renewButtonDisabled,
              ]}
              onPress={handleRenew}
              disabled={!selectedPackage}
              activeOpacity={0.8}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.renewButtonText}>Renew Package</Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    overflow: 'hidden',
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
  expiryInfo: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#f5e6e6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff6b6b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
  },
  whyRenewSection: {
    marginBottom: 24,
  },
  benefitsList: {
    gap: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
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
  packagesSection: {
    marginBottom: 20,
  },
  packagesList: {
    gap: 12,
  },
  packageCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    padding: 16,
    overflow: 'hidden',
  },
  packageCardSelected: {
    backgroundColor: '#fff8f0',
    borderColor: '#f39c12',
    elevation: 3,
    shadowColor: '#f39c12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 13,
    color: '#666',
  },
  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  packageValidity: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  infoSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1a5f7a',
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
  renewButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f39c12',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  renewButtonDisabled: {
    backgroundColor: '#ccc',
  },
  renewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SubscriptionRenewalModal;
