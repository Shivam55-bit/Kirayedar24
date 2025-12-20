import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Image,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { authService } from '../services/authApi.js'; // REMOVED
// import { otpService } from '../services/otpApi.js'; // REMOVED

// Mock API login function (API removed)
const loginWithAPI = async (email, password) => {
  try {
    // Mock login response
    const response = {
      success: true,
      message: 'Login successful (offline mode)',
      user: {
        id: `mock_user_${Date.now()}`,
        email: email,
        name: 'Mock User'
      },
      token: `mock_token_${Date.now()}`
    };
    
    if (response.success) {
      return response;
    } else {
      throw new Error(response.message || 'Login failed');
    }
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

const LoginScreen = ({ navigation }) => {
  const [loginMethod, setLoginMethod] = useState("email"); // email or phone
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // success, error
  const [focusedInput, setFocusedInput] = useState("");

  // Input refs
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const toastAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Toast notification function
  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 50,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const validateEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (loginMethod === "email") {
      if (!email.trim() || !password.trim()) {
        showToast("Please enter both email and password", "error");
        return;
      }

      if (!validateEmail(email)) {
        showToast("Please enter a valid email address", "error");
        return;
      }

      if (password.length < 6) {
        showToast("Password must be at least 6 characters", "error");
        return;
      }

      try {
        setLoading(true);
        
        // Call real login API
        const result = await loginWithAPI(email, password);
        
        if (result.success) {
          showToast("Login Successful! 🎉", "success");
          
          setTimeout(() => {
            setLoading(false);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }]
            });
          }, 1000);
        } else {
          throw new Error('Login failed');
        }
      } catch (error) {
        setLoading(false);
        showToast(error.message || "Invalid credentials. Please try again!", "error");
      }
    } else {
      // Phone number login
      handlePhoneLogin();
    }
  };

  const handlePhoneLogin = async () => {
    // Mock phone number validation (API removed)
    const validation = {
      isValid: phoneNumber && phoneNumber.length >= 10,
      message: phoneNumber && phoneNumber.length >= 10 ? 'Valid' : 'Please enter a valid phone number'
    };
    if (!validation.isValid) {
      showToast(validation.message, "error");
      return;
    }

    try {
      setLoading(true);
      
      // Mock OTP sending (API removed)
      const response = {
        success: true,
        message: 'OTP sent successfully (offline mode)',
        otp: '1234' // Mock OTP for testing
      };
      
      if (response.success) {
        setLoading(false);
        showToast("OTP sent successfully! 📱", "success");
        
        setTimeout(() => {
          navigation.navigate('OtpScreen', { 
            phone: phoneNumber,
            mode: 'phone'
          });
        }, 1000);
      } else {
        setLoading(false);
        showToast(response.message || "Failed to send OTP", "error");
      }
    } catch (error) {
      console.error("Send OTP Error:", error);
      setLoading(false);
      showToast(error.message || "Failed to send OTP. Please try again.", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8FAFB" barStyle="dark-content" />

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: toastType === "success" ? "#4CAF50" : "#F44336",
              transform: [{ translateY: toastAnim }],
            },
          ]}
        >
          <Icon
            name={toastType === "success" ? "checkmark-circle" : "close-circle"}
            size={24}
            color="#fff"
            style={styles.toastIcon}
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        enabled
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          scrollEnabled={true}
        >
          <Animated.View
            style={[
              styles.contentContainer,
              { opacity: fadeAnim, transform: [{ translateY }] },
            ]}
          >
              {/* Logo Section */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Image source={require('../assets/Kirayedar_logo.png')} style={styles.logoImage} />
                </View>
                <Text style={styles.logoText}>Kirayedar24</Text>
                <Text style={styles.tagline}>Your Dream Home Awaits</Text>
              </View>

              {/* Main Card */}
              <View style={styles.card}>
                <Text style={styles.title}>Welcome Back 👋</Text>
                
                {/* Login Method Toggle */}
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      loginMethod === "email" && styles.toggleButtonActive
                    ]}
                    onPress={() => setLoginMethod("email")}
                  >
                    <Icon 
                      name="mail" 
                      size={16} 
                      color={loginMethod === "email" ? "#FFFFFF" : "#64748B"} 
                      style={styles.toggleIcon} 
                    />
                    <Text style={[
                      styles.toggleText,
                      loginMethod === "email" && styles.toggleTextActive
                    ]}>Email</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      loginMethod === "phone" && styles.toggleButtonActive
                    ]}
                    onPress={() => setLoginMethod("phone")}
                  >
                    <Icon 
                      name="call" 
                      size={16} 
                      color={loginMethod === "phone" ? "#FFFFFF" : "#64748B"} 
                      style={styles.toggleIcon} 
                    />
                    <Text style={[
                      styles.toggleText,
                      loginMethod === "phone" && styles.toggleTextActive
                    ]}>Phone</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                  {loginMethod === "email" 
                    ? "Login with your email & password"
                    : "Login with your phone number & OTP"
                  }
                </Text>

                {/* Login Form */}
                {loginMethod === "email" ? (
                  // Email Login Form
                  <>
                    <View style={[
                      styles.inputContainer,
                      focusedInput === "email" && styles.focused
                    ]}>
                      <Icon name="mail" size={20} color="#FDB022" style={styles.inputIcon} />
                      <TextInput
                        ref={emailInputRef}
                        style={styles.input}
                        placeholder="Enter email address"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={(text) => setEmail(text.toLowerCase())}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="emailAddress"
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput("")}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>

                    <Pressable onPress={() => passwordInputRef.current?.focus()}>
                      <View style={[
                        styles.inputContainer,
                        focusedInput === "password" && styles.focused
                      ]}>
                        <Icon name="lock-closed" size={20} color="#FDB022" style={styles.inputIcon} />
                        <TextInput
                          ref={passwordInputRef}
                          style={styles.input}
                          placeholder="Enter password"
                          placeholderTextColor="#94A3B8"
                          value={password}
                          onChangeText={(text) => setPassword(text)}
                          secureTextEntry={!showPassword}
                          onFocus={() => setFocusedInput("password")}
                          onBlur={() => setFocusedInput("")}
                          autoCapitalize="none"
                          autoCorrect={false}
                          textContentType="password"
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                          blurOnSubmit={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.passwordToggle}
                          activeOpacity={0.7}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Icon
                            name={showPassword ? "eye-off" : "eye"}
                            size={20}
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      </View>
                    </Pressable>
                  </>
                ) : (
                  // Phone Login Form
                  <View style={[
                    styles.inputContainer,
                    focusedInput === "phone" && styles.focused
                  ]}>
                    <Icon name="call" size={20} color="#FDB022" style={styles.inputIcon} />
                    <TextInput
                      ref={phoneInputRef}
                      style={styles.input}
                      placeholder="Enter phone number (10 digits)"
                      placeholderTextColor="#94A3B8"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="numeric"
                      autoCorrect={false}
                      onFocus={() => setFocusedInput("phone")}
                      onBlur={() => setFocusedInput("")}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      maxLength={10}
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  style={[
                    styles.loginButton,
                    loading && { opacity: 0.7 }
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginText}>
                        {loginMethod === "email" ? "Login" : "Send OTP"}
                      </Text>
                      <Icon name="arrow-forward-outline" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("SignupScreen")}
              style={styles.signupButton}
            >
              <Text style={styles.signupText}>
                Don't have an account?{" "}
                <Text style={styles.signupBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: { 
    alignItems: "center", 
    marginBottom: 60,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FDB022",
    marginBottom: 20,
    shadowColor: "#FDB022",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 90,
    height: 90,
    resizeMode: "contain",
  },
  logoText: {
    color: "#1A1A1A",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: { 
    color: "#FDB022", 
    fontSize: 15, 
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#E8F5F0",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginBottom: 28,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFB",
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#E8F5F0",
    minHeight: 56,
  },
  focused: {
    borderColor: "#FDB022",
    backgroundColor: "#FFFFFF",
    shadowColor: "#FDB022",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: { 
    marginRight: 14,
  },
  input: { 
    flex: 1, 
    color: "#1A1A1A", 
    fontSize: 16,
    fontWeight: "500",
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 10,
    textAlignVertical: 'center',
  },
  passwordToggle: {
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDB022",
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: "#FDB022",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginText: { 
    color: "#FFFFFF", 
    fontSize: 17, 
    fontWeight: "800", 
    marginRight: 8,
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#E8F5F0",
  },
  dividerText: {
    color: "#94A3B8",
    marginHorizontal: 20,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  signupButton: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#F8FAFB",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E8F5F0",
  },
  signupText: { 
    textAlign: "center", 
    color: "#64748B", 
    fontSize: 15,
    fontWeight: "600",
  },
  signupBold: { 
    color: "#FDB022", 
    fontWeight: "800",
  },
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 9999,
  },
  toastIcon: {
    marginRight: 14,
  },
  toastText: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    marginTop: 20,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FDB022',
    shadowColor: '#FDB022',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleIcon: {
    marginRight: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
