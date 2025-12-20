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

const LoginScreen = ({ navigation }) => {
  const [loginMethod, setLoginMethod] = useState("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (message, type = "success") => {
    Alert.alert(type === "success" ? "Success" : "Error", message);
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast("Please fill all fields", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(email.trim(), password);
      
      if (response.success && response.token) {
        // Get user role from response or stored value
        const userRole = response.user?.userType || response.user?.role || await AsyncStorage.getItem('userRole') || 'Tenant';
        
        // Store user role for future use
        await AsyncStorage.setItem('userRole', userRole);
        
        showToast("Login successful! Welcome! 🎉", "success");
        setTimeout(() => {
          // Navigate to Home - DynamicHomeScreen will handle role-based rendering
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        }, 1500);
      } else {
        showToast(response.message || "Invalid credentials", "error");
      }
    } catch (error) {
      showToast(error.message || "Login failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone.trim()) {
      showToast("Please enter phone number", "error");
      return;
    }

    if (phone.length < 10) {
      showToast("Please enter valid phone number", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.sendPhoneOtp(phone);
      
      if (response.success) {
        showToast("OTP sent successfully! 📱", "success");
        setTimeout(() => {
          navigation.navigate('OtpScreen', { phone: phone, mode: 'phone' });
        }, 1500);
      } else {
        showToast(response.message || "Failed to send OTP", "error");
      }
    } catch (error) {
      showToast(error.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
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
          <Text style={styles.appTitle}>Kirayedar24</Text>
          <Text style={styles.subtitle}>Your Dream Home Awaits</Text>
        </LinearGradient>

      {/* White Card */}
      <View style={styles.card}>
        
        {/* Switch Login Method */}
        <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[styles.toggleBtn, loginMethod === "phone" && styles.activeToggle]}
            onPress={() => setLoginMethod("phone")}
          >
            <Icon name="call" size={18} color={loginMethod === "phone" ? "#fff" : "#555"} />
            <Text style={[styles.toggleText, loginMethod === "phone" && styles.activeToggleText]}>
              Phone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, loginMethod === "email" && styles.activeToggle]}
            onPress={() => setLoginMethod("email")}
          >
            <Icon name="mail" size={18} color={loginMethod === "email" ? "#fff" : "#555"} />
            <Text style={[styles.toggleText, loginMethod === "email" && styles.activeToggleText]}>
              Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* FORM */}
        {loginMethod === "email" ? (
          <>
            <Text style={styles.label}>Login using Email & Password</Text>

            {/* Email Field */}
            <View style={styles.inputBox}>
              <Icon name="mail" size={20} color="#f39c12" />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View style={styles.inputBox}>
              <Icon name="lock-closed" size={20} color="#f39c12" />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? "eye" : "eye-off"} size={22} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate("ForgotPasswordScreen")}
            >
              <Text style={styles.link}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <LinearGradient
              colors={["#f39c12", "#d35400"]}
              style={styles.loginBtn}
            >
              <TouchableOpacity onPress={handleEmailLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Login</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={styles.centerLink}
              onPress={() => navigation.navigate("SignupScreen")}
            >
              <Text style={styles.link}>Create New Account</Text>
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
          </>
        ) : (
          <>
            <Text style={styles.label}>Login using Phone Number</Text>

            <View style={styles.inputBox}>
              <Icon name="call" size={20} color="#f39c12" />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <LinearGradient
              colors={["#f39c12", "#d35400"]}
              style={styles.loginBtn}
            >
              <TouchableOpacity onPress={handlePhoneLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;

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

  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
    padding: 5,
    marginBottom: 30,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  activeToggle: {
    backgroundColor: "#f39c12",
    elevation: 3,
  },

  toggleText: {
    fontSize: 15,
    marginLeft: 8,
    color: "#555",
    fontWeight: "600",
  },

  activeToggleText: {
    color: "#fff",
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

  forgotBtn: {
    alignItems: "flex-end",
    marginTop: -8,
    marginBottom: 10,
  },

  link: {
    color: "#f39c12",
    fontSize: 14,
    fontWeight: "600",
  },

  loginBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  centerLink: {
    marginTop: 20,
    alignItems: "center",
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
});
