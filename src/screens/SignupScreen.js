import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from "../services/authApi";
import { getCitiesByState, getPincodeByCity, getAreasByCity, getPincodeByArea } from "../utils/locationData";
import AuthFlowManager from "../utils/AuthFlowManager";
import CustomAlert from '../components/CustomAlert';
import { sendFCMTokenToBackend } from '../services/api';
import { getStoredFCMToken, getFCMToken } from '../utils/fcmService';

const { width } = Dimensions.get("window");

const SignupScreen = ({ navigation, route }) => {
  const { phoneNumber, fromOtp, email: prefilledEmail } = route.params || {};
  const isCompleteRegistration = fromOtp && phoneNumber;
  
  const [form, setForm] = useState({
    fullName: "",
    email: prefilledEmail || "",
    phone: phoneNumber || "",
    password: isCompleteRegistration ? "" : "",
    state: "",
    city: "",
    post: "",
    street: "",
    pinCode: "",
    userType: "", // "owner" or "tenant"
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    icon: 'checkmark-circle',
    iconColor: '#FDB022'
  });

  // Function to fetch states from API
  const fetchStatesFromAPI = async () => {
    try {
      setStatesLoading(true);
      console.log('🌐 Fetching states from API...');
      const response = await fetch('https://n5.bhoomitechzone.us/api/location/states');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📍 States API response:', data);
      
      // API returns data in the format: { success: true, data: [...] }
      let states = [];
      if (data.success && data.data && Array.isArray(data.data)) {
        states = data.data;
      } else {
        throw new Error('Invalid API response format');
      }
      
      console.log('📍 Total states loaded from API:', states.length);
      console.log('📍 First 10 states:', states.slice(0, 10));
      setAllStates(states);
      
    } catch (error) {
      console.error('❌ Error fetching states from API:', error);
      // Fallback to static data if API fails
      console.log('⚠️ Falling back to static state data');
      const { getAllStates } = await import("../utils/locationData");
      const states = getAllStates();
      setAllStates(states);
    } finally {
      setStatesLoading(false);
    }
  };

  // Function to fetch districts from API
  const fetchDistrictsFromAPI = async (stateName) => {
    try {
      setDistrictsLoading(true);
      console.log('🌐 Fetching districts for state:', stateName);
      const response = await fetch(`https://n5.bhoomitechzone.us/api/location/districts/${stateName}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🏙️ Districts API response:', data);
      
      // API returns data in the format: { success: true, data: [...] }
      let districts = [];
      if (data.success && data.data && Array.isArray(data.data)) {
        districts = data.data;
      } else {
        throw new Error('Invalid API response format');
      }
      
      console.log('🏙️ Total districts loaded from API:', districts.length);
      console.log('🏙️ First 5 districts:', districts.slice(0, 5));
      setAvailableCities(districts);
      
    } catch (error) {
      console.error('❌ Error fetching districts from API:', error);
      // Fallback to static data if API fails
      console.log('⚠️ Falling back to static district data');
      const { getCitiesByState } = await import("../utils/locationData");
      const districts = getCitiesByState(stateName);
      setAvailableCities(districts);
    } finally {
      setDistrictsLoading(false);
    }
  };

  // Load all states on mount
  useEffect(() => {
    fetchStatesFromAPI();
  }, []);

  // Update cities when state changes
  useEffect(() => {
    if (form.state) {
      fetchDistrictsFromAPI(form.state);
      // Reset city, post, area and pincode when state changes
      if (form.city) {
        setForm(prev => ({ ...prev, city: "", post: "", street: "", pinCode: "" }));
      }
    } else {
      setAvailableCities([]);
      setForm(prev => ({ ...prev, city: "", post: "", street: "", pinCode: "" }));
    }
  }, [form.state]);

  // Update posts when city changes
  useEffect(() => {
    if (form.city) {
      // Reset post, area and pincode when city changes
      setForm(prev => ({ ...prev, post: "", street: "", pinCode: "" }));
    } else {
      setForm(prev => ({ ...prev, post: "", street: "", pinCode: "" }));
    }
  }, [form.city]);

  // Auto-fill pincode when post is selected
  useEffect(() => {
    if (form.city && form.post) {
      const pincode = getPincodeByArea(form.city, form.post);
      if (pincode) {
        setForm(prev => ({ ...prev, pinCode: pincode }));
      }
    }
  }, [form.post, form.city]);

  const showToast = (message, type = "success") => {
    Alert.alert(type === "success" ? "Success" : "Error", message);
  };

  const Dropdown = ({ options, selectedValue, onSelect, isOpen, setIsOpen, placeholder, searchText, setSearchText, loading = false, loadingText = "Loading..." }) => {
    const filteredOptions = options.filter(option => 
      option.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[styles.inputBox, isOpen && styles.inputBoxOpen]}
          onPress={() => !loading && setIsOpen(!isOpen)}
          activeOpacity={0.8}
        >
          <Icon name="location" size={20} color="#f39c12" />
          <Text style={[styles.dropdownButtonText, !selectedValue && styles.placeholderDropdownText]} numberOfLines={1}>
            {loading ? loadingText : (selectedValue || placeholder)}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#f39c12" />
          ) : (
            <Icon 
              name={isOpen ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={isOpen ? "#f39c12" : "#666"} 
            />
          )}
        </TouchableOpacity>
        
        <Modal
          visible={isOpen && !loading}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{placeholder}</Text>
                <TouchableOpacity onPress={() => setIsOpen(false)}>
                  <Icon name="close-circle" size={28} color="#f39c12" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <Icon name="search" size={18} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${placeholder.toLowerCase()}...`}
                  placeholderTextColor="#999"
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCorrect={false}
                />
              </View>
              
              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) => `${item}-${index}`}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={() => (
                  <View style={styles.noResults}>
                    <Icon name="search" size={32} color="#ccc" />
                    <Text style={styles.noResultsText}>No results found</Text>
                  </View>
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      selectedValue === item && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setIsOpen(false);
                      setSearchText("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedValue === item && styles.modalItemTextSelected
                    ]} numberOfLines={2}>
                      {item}
                    </Text>
                    {selectedValue === item && (
                      <Icon name="checkmark-circle" size={22} color="#f39c12" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  const handleSignup = async () => {
    // Debug: Log current form state
    console.log('🔍 Form state during signup:', form);
    console.log('🔍 Selected userType:', form.userType);
    console.log('🔍 Is complete registration:', isCompleteRegistration);
    
    // Validation based on signup type
    if (isCompleteRegistration) {
      // Complete registration validation (no password needed)
      if (!form.fullName || !form.email || !form.userType) {
        console.log('❌ Complete registration validation failed:', {
          fullName: !!form.fullName,
          email: !!form.email,
          userType: !!form.userType,
          userTypeValue: form.userType
        });
        showToast("Please fill your name, email and select account type.", "error");
        return;
      }
    } else {
      // Regular signup validation
      if (!form.fullName || !form.email || !form.phone || !form.password || 
          !form.state || !form.city || !form.post || !form.userType) {
        console.log('❌ Regular signup validation failed:', {
          fullName: !!form.fullName,
          email: !!form.email,
          phone: !!form.phone,
          password: !!form.password,
          state: !!form.state,
          city: !!form.city,
          post: !!form.post,
          pinCode: !!form.pinCode,
          userType: !!form.userType,
          userTypeValue: form.userType
        });
        showToast("Please fill all required fields and select account type.", "error");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isCompleteRegistration) {
        // Complete registration for OTP verified user
        // Get FCM token first
        let fcmToken = await getStoredFCMToken();
        if (!fcmToken) {
          console.log('📲 No stored FCM token, generating new one...');
          fcmToken = await getFCMToken();
        }
        console.log('📤 FCM Token for registration:', fcmToken?.substring(0, 30) + '...');
        
        const userData = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: phoneNumber,
          state: form.state.trim(),
          city: form.city.trim(),
          street: form.post.trim(),
          pinCode: form.pinCode.trim(),
          role: form.userType,
          fcmToken: fcmToken || ''  // Include FCM token in signup request
        };
        
        const response = await authService.completeRegistration(userData);
        
        if (response.success) {
          // Use AuthFlowManager to handle registration success
          const isStored = await AuthFlowManager.handleRegistrationSuccess(response);
          
          if (isStored) {
            // FCM token already sent in signup request, no need to send separately
            console.log('✅ Registration complete, FCM token was included in signup request');
            
            showToast("Registration completed successfully! Welcome! 🎉", "success");
            setTimeout(() => {
              // Navigate directly to Home
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }]
              });
            }, 1500);
          } else {
            showToast("Registration successful but data storage failed", "error");
          }
        } else {
          showToast(response.message || "Registration failed", "error");
        }
      } else {
        // Regular signup
        // Get FCM token first
        let fcmToken = await getStoredFCMToken();
        if (!fcmToken) {
          console.log('📲 No stored FCM token, generating new one...');
          fcmToken = await getFCMToken();
        }
        console.log('📤 FCM Token for signup:', fcmToken?.substring(0, 30) + '...');
        
        const userData = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          state: form.state.trim(),
          city: form.city.trim(),
          street: form.post.trim(),
          pinCode: form.pinCode.trim(),
          password: form.password,
          role: form.userType,
          fcmToken: fcmToken || ''  // Include FCM token in signup request
        };
        
        const response = await authService.signup(userData);
        
        console.log('🔍 Signup response received:', response);
        
        if (response.success) {
          // Show success popup and navigate to Login screen
          setAlertConfig({
            visible: true,
            title: 'Registration Successful! 🎉',
            message: `Welcome ${form.fullName}!\n\nYour account has been created successfully.\n\nPlease login to continue.`,
            icon: 'checkmark-circle',
            iconColor: '#4CAF50',
            buttons: [
              {
                text: 'Login Now',
                onPress: () => {
                  navigation.navigate('LoginScreen', {
                    phone: form.phone.trim(),
                    fromSignup: true
                  });
                },
              },
            ],
          });
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#f9d976" barStyle="dark-content" translucent={false} />
      
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
            onPress={() => {
              console.log('🏠 Setting userType to Owner');
              setForm({ ...form, userType: "Owner" });
            }}
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
            onPress={() => {
              console.log('🔍 Setting userType to Tenant');
              setForm({ ...form, userType: "Tenant" });
            }}
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

        {/* Phone Field - Always show for complete profile */}
        <View style={styles.inputBox}>
          <Icon name="call" size={20} color="#f39c12" />
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            maxLength={10}
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            editable={true}
          />
        </View>

        {/* State Field */}
        <Dropdown
          options={allStates}
          selectedValue={form.state}
          onSelect={(value) => setForm({ ...form, state: value, city: "", post: "", pinCode: "" })}
          isOpen={stateDropdownOpen}
          setIsOpen={(val) => {
            setStateDropdownOpen(val);
            if (val) {
              setCityDropdownOpen(false);
            }
          }}
          placeholder="Select your state"
          searchText={stateSearch}
          setSearchText={setStateSearch}
          loading={statesLoading}
          loadingText="Loading states..."
        />

        {/* City Field */}
        <Dropdown
          options={availableCities}
          selectedValue={form.city}
          onSelect={(value) => setForm({ ...form, city: value, post: "", pinCode: "" })}
          isOpen={cityDropdownOpen}
          setIsOpen={(val) => {
            setCityDropdownOpen(val);
            if (val) {
              setStateDropdownOpen(false);
            }
          }}
          placeholder={form.state ? "Select your city/district" : "Select state first"}
          searchText={citySearch}
          setSearchText={setCitySearch}
          loading={districtsLoading && form.state}
          loadingText="Loading districts..."
        />

        {/* Post Office Field */}
        <View style={styles.inputBox}>
          <Icon name="location" size={20} color="#f39c12" />
          <TextInput
            style={styles.input}
            placeholder={form.city ? "Enter your City/area" : "Select District first"}
            placeholderTextColor="#9ca3af"
            value={form.post}
            onChangeText={(text) => setForm({ ...form, post: text })}
            editable={!!form.city}
          />
        </View>

        {/* Pin Code Field */}
        <View>
          <View style={styles.inputBox}>
            <Icon name="pin" size={20} color="#f39c12" />
            <TextInput
              style={styles.input}
              placeholder=" Enter Pin code (optional)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={6}
              value={form.pinCode}
              onChangeText={(text) => {
                // Only allow numbers
                const numericText = text.replace(/[^0-9]/g, '');
                setForm({ ...form, pinCode: numericText });
              }}
              editable={true}
            />
            {form.pinCode && form.pinCode.length === 6 && (
              <Icon name="checkmark-circle" size={20} color="#10b981" style={{ marginLeft: 8 }} />
            )}
          </View>
          {form.city && form.post && form.pinCode && (
            <Text style={styles.helperText}>
              ✓ Auto-filled for {form.post}. You can edit if incorrect.
            </Text>
          )}
          {form.pinCode && form.pinCode.length > 0 && form.pinCode.length < 6 && (
            <Text style={styles.errorText}>
              Pincode must be 6 digits
            </Text>
          )}
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

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
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
  },  helperText: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 4,
    marginLeft: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
    marginLeft: 12,
    marginBottom: 8,
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
    marginLeft: 12,
  },
  placeholderDropdownText: {
    color: "#9ca3af",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  inputBoxOpen: {
    borderColor: "#f39c12",
  },
  // Modal styles for dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalItemSelected: {
    backgroundColor: '#fff5e6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalItemTextSelected: {
    color: '#f39c12',
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  // Old dropdown styles (can be removed later)
  dropdownList: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    maxHeight: 300,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#333",
  },
});
