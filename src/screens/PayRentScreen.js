import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
// import { paymentService } from '../services/paymentApi.js'; // REMOVED

const { width, height } = Dimensions.get('window');

const PayRentScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [rentType, setRentType] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const rentTypes = [
    { key: 'monthly', label: 'Monthly', icon: 'calendar-outline' },
    { key: 'quarterly', label: 'Quarterly', icon: 'calendar' },
    { key: 'yearly', label: 'Yearly', icon: 'calendar-sharp' },
  ];

  const paymentMethods = [
    { key: 'upi', label: 'UPI', icon: 'phone-portrait-outline', color: '#4CAF50' },
    { key: 'card', label: 'Card', icon: 'card-outline', color: '#2196F3' },
    { key: 'netbanking', label: 'Net Banking', icon: 'globe-outline', color: '#FF9800' },
    { key: 'wallet', label: 'Wallet', icon: 'wallet-outline', color: '#9C27B0' },
  ];

  const handlePayRent = async () => {
    if (!amount || !propertyAddress || !ownerName) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Alert.alert(
      'Payment Confirmation',
      `Pay ₹${amount} for ${rentType} rent?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            try {
              setLoading(true);
              
              const paymentData = {
                amount: Number(amount),
                propertyAddress,
                ownerName,
                ownerPhone,
                rentType,
                type: 'rent'
              };
              
              // Mock payment processing (API removed)
              const response = {
                success: true,
                message: 'Payment processed successfully (offline mode)',
                paymentId: `mock_payment_${Date.now()}`
              };
              
              if (response.success) {
                Alert.alert('Success', 'Rent payment initiated successfully!', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', response.message || 'Payment failed');
              }
            } catch (error) {
              console.error('Payment error:', error);
              Alert.alert('Error', 'Payment failed. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Rent</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rent Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rent Type</Text>
          <View style={styles.rentTypeContainer}>
            {rentTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.rentTypeButton,
                  rentType === type.key && styles.rentTypeButtonActive,
                ]}
                onPress={() => setRentType(type.key)}
              >
                <Icon
                  name={type.icon}
                  size={20}
                  color={rentType === type.key ? '#FFFFFF' : '#FDB022'}
                />
                <Text
                  style={[
                    styles.rentTypeText,
                    rentType === type.key && styles.rentTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rent Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rent Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Rent Amount *</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Property Address *</Text>
            <TextInput
              style={styles.textInput}
              value={propertyAddress}
              onChangeText={setPropertyAddress}
              placeholder="Enter your property address"
              multiline={true}
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Owner Name *</Text>
            <TextInput
              style={styles.textInput}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Enter owner's name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Owner Contact</Text>
            <TextInput
              style={styles.textInput}
              value={ownerPhone}
              onChangeText={setOwnerPhone}
              placeholder="Enter owner's phone number"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          <View style={styles.paymentMethodsGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity key={method.key} style={styles.paymentMethodCard}>
                <View style={[styles.paymentIconContainer, { backgroundColor: method.color }]}>
                  <Icon name={method.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.paymentMethodText}>{method.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rent Amount</Text>
            <Text style={styles.summaryValue}>₹{amount || '0'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>₹10</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total Amount</Text>
            <Text style={styles.summaryTotalValue}>₹{amount ? parseInt(amount) + 10 : '10'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={handlePayRent} style={styles.payButton}>
          <LinearGradient
            colors={['#FDBF4D', '#FDB022', '#E89E0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.payButtonGradient}
          >
            <Icon name="card-outline" size={20} color="#FFFFFF" />
            <Text style={styles.payButtonText}>
              Pay ₹{amount ? parseInt(amount) + 10 : '10'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  rentTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FDB022',
    gap: 8,
  },
  rentTypeButtonActive: {
    backgroundColor: '#FDB022',
    borderColor: '#FDB022',
  },
  rentTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FDB022',
  },
  rentTypeTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FDB022',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 16,
    color: '#1A1A1A',
    textAlignVertical: 'top',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentMethodCard: {
    width: (width - 64) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FDB022',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PayRentScreen;