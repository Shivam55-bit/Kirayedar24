import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from "../services/authApi";

const { width } = Dimensions.get("window");

const SignupScreen = ({ navigation, route }) => {
  const { phoneNumber, fromOtp } = route.params || {};
  const isCompleteRegistration = fromOtp && phoneNumber;
  
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: phoneNumber || "",
    password: isCompleteRegistration ? "" : "",
    state: "",
    city: "",
    street: "",
    pinCode: "",
    userType: "", // "owner" or "tenant"
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const showToast = (message, type = "success") => {
    Alert.alert(type === "success" ? "Success" : "Error", message);
  };

  const Dropdown = ({ options, selectedValue, onSelect, isOpen, setIsOpen, placeholder }) => (
    <View style={[styles.dropdownContainer, isOpen && { zIndex: 1000 }]}>
      <View style={styles.inputBox}>
        <Icon name="location" size={20} color="#f39c12" />
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={[styles.dropdownButtonText, !selectedValue && styles.placeholderText]}>
            {selectedValue || placeholder}
          </Text>
          <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView 
            style={styles.dropdownScroll} 
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            bounces={false}
            scrollEventThrottle={16}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{option}</Text>
                {selectedValue === option && (
                  <Icon name="checkmark" size={18} color="#f39c12" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const handleSignup = async () => {
    // Validation based on signup type
    if (isCompleteRegistration) {
      // Complete registration validation (no password needed)
      if (!form.fullName || !form.email || !form.userType) {
        showToast("Please fill your name, email and select account type.", "error");
        return;
      }
    } else {
      // Regular signup validation
      if (!form.fullName || !form.email || !form.phone || !form.password || 
          !form.state || !form.city || !form.street || !form.pinCode || !form.userType) {
        showToast("Please fill all required fields and select account type.", "error");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isCompleteRegistration) {
        // Complete registration for OTP verified user
        const userData = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: phoneNumber,
          state: form.state.trim(),
          city: form.city.trim(),
          street: form.street.trim(),
          pinCode: form.pinCode.trim(),
          role: form.userType
        };
        
        const response = await authService.completeRegistration(userData);
        
        if (response.success) {
          showToast("Registration completed successfully!", "success");
          setTimeout(() => {
            // Navigate to Home - DynamicHomeScreen will handle role-based rendering
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }]
            });
          }, 1500);
        } else {
          showToast(response.message || "Registration failed", "error");
        }
      } else {
        // Regular signup
        const userData = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          state: form.state.trim(),
          city: form.city.trim(),
          street: form.street.trim(),
          pinCode: form.pinCode.trim(),
          password: form.password,
          role: form.userType
        };
        
        const response = await authService.signup(userData);
        
        console.log('🔍 Signup response received:', response);
        
        if (response.success) {
          // Store user role for login navigation
          await AsyncStorage.setItem('userRole', form.userType);
          
          showToast("Account created successfully! Please login.", "success");
          setTimeout(() => {
            navigation.navigate("LoginScreen", {
              email: form.email.trim(),
              fromSignup: true,
              userRole: form.userType
            });
          }, 1500);
        } else {
          const errorMessage = response.message || response.error || "Signup failed - please try again";
          console.error('❌ Signup failed with message:', errorMessage);
          showToast(errorMessage, "error");
        }
      }
    } catch (error) {
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Gradient */}
        <LinearGradient
          colors={["#f9d976", "#f39c12"]}
          style={styles.headerContainer}
        >
          <Text style={styles.appTitle}>
            {isCompleteRegistration ? "Complete Profile" : "Create Account"}
          </Text>
          <Text style={styles.subtitle}>
            {isCompleteRegistration ? "Complete your profile to get started" : "Join and explore premium properties"}
          </Text>
        </LinearGradient>

      {/* White Card */}
      <View style={styles.card}>
        
        {/* Form Fields */}
        <Text style={styles.label}>Enter your details to get started</Text>

        {/* Name Field */}
        <View style={styles.inputBox}>
          <Icon name="person" size={20} color="#f39c12" />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#9ca3af"
            value={form.fullName}
            onChangeText={(text) => setForm({ ...form, fullName: text })}
          />
        </View>

        {/* Email Field */}
        <View style={styles.inputBox}>
          <Icon name="mail" size={20} color="#f39c12" />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />
        </View>

        {/* User Type Selection */}
        <Text style={styles.roleHeading}>Account Type *</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[
              styles.roleBtn,
              form.userType === "Owner" && styles.roleBtnActive,
            ]}
            onPress={() => setForm({ ...form, userType: "Owner" })}
          >
            <Icon 
              name="home" 
              size={20} 
              color={form.userType === "Owner" ? "#fff" : "#f39c12"} 
            />
            <Text
              style={[
                styles.roleText,
                form.userType === "Owner" && styles.roleTextActive,
              ]}
            >
              Property Owner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleBtn,
              form.userType === "Tenant" && styles.roleBtnActive,
            ]}
            onPress={() => setForm({ ...form, userType: "Tenant" })}
          >
            <Icon 
              name="search" 
              size={20} 
              color={form.userType === "Tenant" ? "#fff" : "#f39c12"} 
            />
            <Text
              style={[
                styles.roleText,
                form.userType === "Tenant" && styles.roleTextActive,
              ]}
            >
              Looking for Rent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Phone Field */}
        {!isCompleteRegistration && (
          <View style={styles.inputBox}>
            <Icon name="call" size={20} color="#f39c12" />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
            />
          </View>
        )}

        {/* State Field */}
        <Dropdown
          options={["Delhi", "Maharashtra", "Karnataka", "Gujarat", "Rajasthan", "Uttar Pradesh", "Punjab", "Haryana", "Tamil Nadu", "West Bengal", "Other"]}
          selectedValue={form.state}
          onSelect={(value) => setForm({ ...form, state: value })}
          isOpen={stateDropdownOpen}
          setIsOpen={(val) => {
            setStateDropdownOpen(val);
            if (val) setCityDropdownOpen(false);
          }}
          placeholder="Select your state"
        />

        {/* City Field */}
        <Dropdown
          options={["Mumbai", "Delhi", "Bangalore", "Pune", "Ahmedabad", "Jaipur", "Chandigarh", "Hyderabad", "Chennai", "Kolkata", "Other"]}
          selectedValue={form.city}
          onSelect={(value) => setForm({ ...form, city: value })}
          isOpen={cityDropdownOpen}
          setIsOpen={(val) => {
            setCityDropdownOpen(val);
            if (val) setStateDropdownOpen(false);
          }}
          placeholder="Select your city"
        />

        {/* Street Field */}
        <View style={styles.inputBox}>
          <Icon name="home" size={20} color="#f39c12" />
          <TextInput
            style={styles.input}
            placeholder="Enter your street address"
            placeholderTextColor="#9ca3af"
            value={form.street}
            onChangeText={(text) => setForm({ ...form, street: text })}
          />
        </View>

        {/* Pin Code Field */}
        <View style={styles.inputBox}>
          <Icon name="pin" size={20} color="#f39c12" />
          <TextInput
            style={styles.input}
            placeholder="Enter your pin code"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            maxLength={6}
            value={form.pinCode}
            onChangeText={(text) => setForm({ ...form, pinCode: text })}
          />
        </View>

        {/* Password */}
        {!isCompleteRegistration && (
          <View style={styles.inputBox}>
            <Icon name="lock-closed" size={20} color="#f39c12" />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? "eye" : "eye-off"} size={22} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* Signup Button */}
        <LinearGradient
          colors={["#f39c12", "#d35400"]}
          style={styles.signupBtn}
        >
          <TouchableOpacity onPress={handleSignup} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupText}>
                {isCompleteRegistration ? "Complete Profile" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity
          style={styles.centerLink}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Google */}
        <TouchableOpacity style={styles.googleBtn}>
          <Icon name="logo-google" size={22} color="#DB4437" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  headerContainer: {
    width: "100%",
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 6,
  },

  appTitle: {
    fontSize: 30,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: "#fff",
    marginTop: 6,
    opacity: 0.9,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -30,
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 25,
    elevation: 8,
    shadowColor: "#f39c12",
  },

  label: {
    fontSize: 16,
    marginBottom: 20,
    color: "#555",
    fontWeight: "500",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 18,
    elevation: 2,
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },

  roleHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
    marginTop: 5,
  },

  roleRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 25,
  },

  roleBtn: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
  },

  roleBtnActive: {
    backgroundColor: "#f39c12",
    borderColor: "#f39c12",
    elevation: 4,
  },

  roleText: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },

  roleTextActive: {
    color: "#fff",
  },

  signupBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  signupText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  centerLink: {
    marginTop: 20,
    alignItems: "center",
  },

  link: {
    color: "#f39c12",
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },

  or: {
    marginHorizontal: 10,
    color: "#888",
    fontSize: 14,
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    borderRadius: 12,
  },

  googleText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Dropdown styles
  dropdownContainer: {
    marginBottom: 16,
    position: "relative",
    zIndex: 1,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownButtonText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#9ca3af",
  },
  dropdownList: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    maxHeight: 200,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 1000,
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 200,
    flexGrow: 0,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#333",
  },
});
