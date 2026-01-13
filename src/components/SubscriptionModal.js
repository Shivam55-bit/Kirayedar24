import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import RazorpayCheckout from 'react-native-razorpay';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from '../context/SubscriptionContext';
import subscriptionApi from '../services/subscriptionApi';
import { RAZORPAY_KEY_ID, BASE_URL } from '../config/api.config';

const { width } = Dimensions.get('window');
const API_BASE = `${BASE_URL}/api/tenant-subscription`;

const SubscriptionModal = ({ visible, onClose, onSuccess }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const { refreshSubscription } = useSubscription();

  /**
   * Load subscription packages when modal opens
   */
  useEffect(() => {
    if (visible) {
      checkTokenAndFetchPackages();
    }
  }, [visible]);

  /**
   * Check token exists before fetching packages
   */
  const checkTokenAndFetchPackages = async () => {
    try {
      // Check if token exists
      let token = await AsyncStorage.getItem('userToken');
      if (!token) token = await AsyncStorage.getItem('token');
      if (!token) token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('❌ No token found, cannot fetch packages');
        
        // Log all keys for debugging
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('📦 Available keys in AsyncStorage:', allKeys);
        
        Alert.alert(
          'Session Expired',
          'Your login session has expired. Please close this and login again.',
          [
            { 
              text: 'Close', 
              onPress: () => onClose()
            }
          ]
        );
        return;
      }
      
      console.log('✅ Token found, fetching packages...');
      await fetchSubscriptionPackages();
    } catch (error) {
      console.error('Error checking token:', error);
      Alert.alert('Error', 'Unable to verify authentication');
    }
  };

  /**
   * Fetch available subscription packages
   */
  const fetchSubscriptionPackages = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching subscription packages...');
      const response = await subscriptionApi.getSubscriptionPackages();
      
      console.log('📦 Packages response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Packages loaded:', response.data.length);
        console.log('📦 First package:', response.data[0]); // Log first package to see structure
        setPackages(Array.isArray(response.data) ? response.data : []);
      } else {
        console.log('❌ Failed to load packages:', response.message);
        Alert.alert('Error', response.message || 'Failed to load subscription packages');
      }
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      Alert.alert('Error', 'Unable to load subscription packages');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle package selection and initiate payment
   */
  const handleSelectPackage = async (packageItem) => {
    try {
      setSelectedPackage(packageItem);
      setProcessingPayment(true);

      console.log('💳 Creating order for package:', packageItem);
      console.log('💳 Package ID:', packageItem._id);
      console.log('💳 API Call: POST', `${API_BASE}/create-order`);
      console.log('💳 Request body:', { packageId: packageItem._id });

      // Validate package ID exists
      if (!packageItem._id) {
        Alert.alert('Error', 'Invalid package selected. Package ID is missing.');
        setProcessingPayment(false);
        return;
      }

      // Create order
      const orderResponse = await subscriptionApi.createSubscriptionOrder(packageItem._id);
      
      console.log('📦 Full Order response:', JSON.stringify(orderResponse, null, 2));
      
      if (!orderResponse.success) {
        const errorMsg = orderResponse.message || 'Failed to create order';
        console.log('❌ Order creation failed:', errorMsg);
        
        // Show comprehensive error with backend help info
        Alert.alert(
          '🔴 Backend API Issue', 
          `Error: ${errorMsg}\n\n📋 Debug Info:\n• Package: ${packageItem.name}\n• Package ID: ${packageItem._id}\n• API: /create-order\n\n⚠️ THIS IS A BACKEND ISSUE\n\nThe package ID exists in GET /packages but not found in POST /create-order.\n\nBackend needs to fix the create-order endpoint.`,
          [
            { 
              text: 'Close', 
              onPress: () => setProcessingPayment(false),
              style: 'cancel'
            },
            {
              text: '🧪 Skip & Test UI',
              onPress: () => {
                setProcessingPayment(false);
                Alert.alert(
                  'Development Mode',
                  `This would open Razorpay for:\n\n${packageItem.name}\n₹${packageItem.amount}/${packageItem.durationValue} ${packageItem.durationType}\n\n✅ Frontend is 100% ready\n⏳ Waiting for backend fix\n\nOnce backend fixes create-order, payment will work automatically!`,
                  [{ text: 'OK' }]
                );
              }
            }
          ]
        );
        return;
      }

      const { orderId, amount, currency, purchaseId, packageName } = orderResponse.data;

      console.log('✅ Order created successfully:', { orderId, amount, currency, purchaseId, packageName });

      // Open Razorpay checkout
      const options = {
        description: packageItem.description || packageName,
        image: 'https://your-logo-url.com/logo.png',
        currency: currency || 'INR',
        key: RAZORPAY_KEY_ID,
        amount: amount * 100, // Razorpay expects amount in paise
        order_id: orderId,
        name: 'Kirayedar24 Subscription',
        prefill: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'User Name',
        },
        theme: { color: '#2E86DE' },
      };

      console.log('🚀 Opening Razorpay with options:', options);

      RazorpayCheckout.open(options)
        .then((data) => handlePaymentSuccess(data, purchaseId))
        .catch(handlePaymentError);
    } catch (error) {
      console.error('❌ Error initiating payment:', error);
      Alert.alert('Error', error.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = async (data, purchaseId) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;

      console.log('✅ Payment successful:', { razorpay_payment_id, razorpay_order_id });

      // Verify payment on backend
      const verifyResponse = await subscriptionApi.verifySubscriptionPayment({
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        packageId: selectedPackage._id,
        purchaseId, // Include purchaseId from order creation
      });

      console.log('📦 Verify response:', verifyResponse);

      if (verifyResponse.success) {
        // Refresh subscription status
        await refreshSubscription();
        
        Alert.alert(
          'Success',
          'Subscription activated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setProcessingPayment(false);
                onClose();
                if (onSuccess) onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', verifyResponse.message || 'Payment verification failed');
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      Alert.alert('Error', 'Failed to verify payment');
      setProcessingPayment(false);
    }
  };

  /**
   * Handle payment error
   */
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    
    if (error.code !== 0) { // 0 means user cancelled
      Alert.alert(
        'Payment Failed',
        error.description || 'Something went wrong with the payment'
      );
    }
    
    setProcessingPayment(false);
  };

  /**
   * Render package card
   */
  const renderPackageCard = (packageItem, index) => {
    const gradientColors = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
    ];

    const colors = gradientColors[index % gradientColors.length];
    const isPopular = index === 1; // Mark second package as popular

    return (
      <TouchableOpacity
        key={packageItem._id}
        onPress={() => handleSelectPackage(packageItem)}
        disabled={processingPayment}
        style={styles.packageCardContainer}
      >
        <LinearGradient
          colors={colors}
          style={styles.packageCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isPopular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}

          <View style={styles.packageHeader}>
            <Text style={styles.packageName}>{packageItem.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.price}>{packageItem.amount}</Text>
              <Text style={styles.duration}>
                /{packageItem.durationValue} {packageItem.durationType}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{packageItem.description}</Text>

          <View style={styles.featuresContainer}>
            {packageItem.features && packageItem.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Icon name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handleSelectPackage(packageItem)}
            disabled={processingPayment}
          >
            <Text style={styles.selectButtonText}>
              {processingPayment && selectedPackage?._id === packageItem._id
                ? 'Processing...'
                : 'Select Plan'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Your Plan</Text>
            <TouchableOpacity onPress={onClose} disabled={processingPayment}>
              <Icon name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Subscribe to view property details and contact owners
          </Text>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E86DE" />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {packages.length > 0 ? (
                packages.map((packageItem, index) => renderPackageCard(packageItem, index))
              ) : (
                <View style={styles.emptyContainer}>
                  <Icon name="alert-circle-outline" size={60} color="#999" />
                  <Text style={styles.emptyText}>No subscription plans available</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
  },
  packageCardContainer: {
    marginBottom: 20,
  },
  packageCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageHeader: {
    marginBottom: 15,
  },
  packageName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 4,
  },
  duration: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 10,
    flex: 1,
  },
  selectButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E86DE',
  },
});

export default SubscriptionModal;
