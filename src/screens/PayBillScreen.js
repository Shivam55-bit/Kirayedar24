import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Animated,
  ImageBackground,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#FDB022",
  primaryDark: "#E09500",
  primaryLight: "#FFD77A",
  secondary: "#667EEA",
  accent: "#764ABC",
  background: "#FFFFFF",
  backgroundGradient: ["#FFFFFF", "#F8FAFC"],
  card: "#FFFFFF",
  cardShadow: "rgba(0,0,0,0.08)",
  textPrimary: "#1A202C",
  textSecondary: "#718096",
  textLight: "#A0AEC0",
  border: "#E2E8F0",
  success: "#48BB78",
  error: "#F56565",
  glass: "rgba(255,255,255,0.95)",
  glassBorder: "rgba(255,255,255,0.18)",
};

const billCategories = [
  { id: "electricity", name: "Electricity", icon: "flash", color: "#F59E0B", bgColor: "#FEF3C7", providers: ["BSES", "Tata Power", "Adani Power", "MSEDCL"] },
  { id: "water", name: "Water", icon: "water", color: "#06B6D4", bgColor: "#CFFAFE", providers: ["Delhi Jal Board", "Mumbai Water", "Bangalore Water"] },
  { id: "gas", name: "Gas", icon: "flame", color: "#EF4444", bgColor: "#FEE2E2", providers: ["Indane", "Bharat Gas", "HP Gas"] },
  { id: "broadband", name: "Broadband", icon: "wifi", color: "#8B5CF6", bgColor: "#EDE9FE", providers: ["Airtel", "Jio Fiber", "ACT Fibernet", "BSNL"] },
  { id: "dth", name: "DTH/TV", icon: "tv", color: "#EC4899", bgColor: "#FCE7F3", providers: ["Tata Sky", "Airtel Digital TV", "Dish TV", "Sun Direct"] },
  { id: "mobile", name: "Mobile", icon: "phone-portrait", color: "#10B981", bgColor: "#D1FAE5", providers: ["Airtel", "Jio", "Vi", "BSNL"] },
  { id: "maintenance", name: "Society", icon: "business", color: "#6366F1", bgColor: "#E0E7FF", providers: ["Society Maintenance"] },
  { id: "other", name: "Other", icon: "card", color: "#64748B", bgColor: "#F1F5F9", providers: ["Custom"] },
];

const PayBillScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedProvider("");
    setBillNumber("");
    setAmount("");
    setCustomerName("");
    
    // Animate selection
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePayment = () => {
    if (!selectedCategory || !selectedProvider || !billNumber || !amount) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    Alert.alert(
      "Confirm Payment",
      `Pay ₹${amount} for ${selectedCategory.name} bill?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert("Success", "Bill payment successful!", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            }, 1800);
          },
        },
      ]
    );
  };

  const renderCategoryGrid = () => (
    <View style={styles.categoryContainer}>
      <Animated.View style={[styles.categoryGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {billCategories.map((category, index) => {
          const isSelected = selectedCategory?.id === category.id;
          return (
            <Animated.View
              key={category.id}
              style={[
                styles.categoryWrapper,
                {
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardActive,
                  { backgroundColor: isSelected ? category.color : category.bgColor }
                ]}
                onPress={() => handleCategorySelect(category)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSelected ? [category.color, category.color + "CC"] : [category.bgColor, category.bgColor]}
                  style={styles.categoryGradient}
                >
                  <View style={[
                    styles.categoryIconContainer,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.9)' }
                  ]}>
                    <Icon 
                      name={category.icon} 
                      size={24} 
                      color={isSelected ? "#fff" : category.color} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryName,
                    { color: isSelected ? "#fff" : category.color }
                  ]}>
                    {category.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Icon name="checkmark-circle" size={16} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );

  const renderPaymentForm = () => {
    if (!selectedCategory) return null;

    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Pay {selectedCategory.name} Bill</Text>

        {/* Provider Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Provider *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCategory.providers.map((provider) => (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.chip,
                  selectedProvider === provider && styles.chipActive,
                ]}
                onPress={() => setSelectedProvider(provider)}
              >
                <Text style={[
                  styles.chipText,
                  selectedProvider === provider && styles.chipTextActive,
                ]}>
                  {provider}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bill Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bill/Consumer Number *</Text>
          <View style={styles.inputBox}>
            <Icon name="card-outline" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Enter bill number"
              placeholderTextColor={COLORS.textSecondary}
              onChangeText={setBillNumber}
              value={billNumber}
            />
          </View>
        </View>

        {/* Customer Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Customer Name</Text>
          <View style={styles.inputBox}>
            <Icon name="person-outline" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Enter name (optional)"
              placeholderTextColor={COLORS.textSecondary}
              onChangeText={setCustomerName}
              value={customerName}
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor={COLORS.textSecondary}
              onChangeText={setAmount}
              value={amount}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickRow}>
          {["500", "1000", "2000", "5000"].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={styles.quickBtn}
              onPress={() => setAmount(amt)}
            >
              <Text style={styles.quickText}>₹{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={styles.payBtn}
          disabled={loading}
          onPress={handlePayment}
        >
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary, COLORS.primaryDark]}
            style={styles.payGradient}
          >
            <Icon name="card" size={20} color="#fff" />
            <Text style={styles.payText}>
              {loading ? "Processing..." : `Pay ₹${amount || "0"}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Pay Bills</Text>
            <Text style={styles.headerSubtitle}>Quick & Secure Payments</Text>
          </View>
          
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="notifications-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Premium Banner */}
          <Animated.View style={[styles.premiumBanner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerIcon}>
                <Icon name="shield-checkmark" size={24} color="#fff" />
              </View>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>100% Secure Payments</Text>
                <Text style={styles.bannerSubtext}>Powered by advanced encryption</Text>
              </View>
              <Icon name="star" size={20} color="#FFD700" />
            </LinearGradient>
          </Animated.View>

          {/* Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Choose Bill Category</Text>
              <View style={styles.sectionLine} />
            </View>
            {renderCategoryGrid()}
          </View>

          {renderPaymentForm()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: 30,
  },

  premiumBanner: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  bannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  bannerContent: {
    flex: 1,
  },
  
  bannerTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#fff",
    marginBottom: 4,
  },
  
  bannerSubtext: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },

  section: { 
    paddingHorizontal: 20, 
    marginBottom: 20 
  },
  
  sectionHeader: {
    marginBottom: 20,
  },
  
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  
  sectionLine: {
    height: 3,
    width: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  
  categoryContainer: {
    marginTop: 10,
  },

  categoryGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: 'space-between',
  },
  
  categoryWrapper: {
    width: (width - 60) / 2,
    marginBottom: 16,
  },
  
  categoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  
  categoryGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  categoryName: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 2,
  },

  formContainer: {
    backgroundColor: COLORS.card,
    margin: 20,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  formTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    marginBottom: 24,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },

  inputGroup: { marginBottom: 20 },
  
  label: { 
    fontSize: 15, 
    fontWeight: "700", 
    marginBottom: 8,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },

  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  
  chipActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary,
    transform: [{ scale: 1.05 }],
  },
  
  chipText: { 
    fontWeight: "600", 
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  
  chipTextActive: { color: "#fff" },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  
  input: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  
  currency: { 
    fontSize: 18, 
    fontWeight: "800",
    color: COLORS.primary,
  },

  quickRow: { 
    flexDirection: "row", 
    gap: 12, 
    marginBottom: 24 
  },
  
  quickBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  
  quickText: { 
    fontWeight: "700", 
    color: COLORS.textPrimary,
    fontSize: 14,
  },

  payBtn: { 
    borderRadius: 16, 
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  
  payGradient: {
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  
  payText: { 
    fontSize: 17, 
    fontWeight: "800", 
    color: "#fff",
    letterSpacing: -0.3,
  },
});

export default PayBillScreen;
