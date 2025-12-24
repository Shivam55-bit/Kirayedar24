import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Modal,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredFCMToken } from "../utils/fcmService";
import { sendFCMTokenToBackend } from "../services/api";
import { authService } from "../services/authApi";
import { storeUserCredentials } from '../utils/authManager';
import AuthFlowManager from "../utils/AuthFlowManager";

const OtpScreen = ({ route, navigation }) => {
  const { phone, mode = "phone", fromPhoneVerification = false } = route.params;
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
  const [canResend, setCanResend] = useState(false);
  // Removed showRegisterModal - no longer needed
  const inputs = useRef([]);
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

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
      Animated.delay(2500),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleChange = (text, index) => {
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // Auto move to next input
      if (index < 3 && text) {
        inputs.current[index + 1].focus();
      }
    } else if (text === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join("");
    
    // Validate OTP format
    if (enteredOtp.length !== 4) {
      showToast("Please enter complete 4-digit OTP", "error");
      return;
    }

    try {
      setLoading(true);
      
      console.log('\n=================================================');
      console.log('🔐 OTP VERIFICATION STARTING');
      console.log('=================================================');
      console.log('📱 Phone:', phone);
      console.log('🔑 OTP entered:', enteredOtp);
      console.log('=================================================\n');
      
      // Use authService for OTP verification
      const otpResponse = await authService.verifyPhoneOtp(phone, enteredOtp);
      
      console.log('\n=================================================');
      console.log('📥 OTP VERIFICATION RESPONSE');
      console.log('=================================================');
      console.log('📦 Full response:', JSON.stringify(otpResponse, null, 2));
      console.log('✅ Success?', otpResponse.success);
      console.log('🔑 Has token?', !!otpResponse.token);
      console.log('👤 Has user?', !!otpResponse.user);
      console.log('💬 Message:', otpResponse.message);
      console.log('=================================================\n');
      
      // ✅ IMPORTANT: If OTP verification successful, ALWAYS go to Home
      // Ignore isNewUser flag - we already validated user exists in LoginScreen
      if (otpResponse.success) {
        console.log('✅✅✅ OTP VERIFIED ✅✅✅');
        
        // MUST have token and user data to proceed
        if (!otpResponse.token || !otpResponse.user) {
          console.error('❌ Missing token or user data in response!');
          console.error('Token exists:', !!otpResponse.token);
          console.error('User exists:', !!otpResponse.user);
          setLoading(false);
          showToast("Login failed - please try again or contact support", "error");
          return;
        }
        
        console.log('💾 Storing auth data');
        console.log('📦 User data:', otpResponse.user);
        
        // Store auth data
        const stored = await AuthFlowManager.storeAuthData(
          otpResponse.token, 
          otpResponse.user.id, 
          otpResponse.user
        );
        
        if (!stored) {
          console.error('❌ Failed to store auth data!');
          setLoading(false);
          showToast("Failed to save login data - please try again", "error");
          return;
        }
        
        console.log('✅ Auth data stored successfully');
        
        // Handle FCM token
        try {
          const fcmToken = await getStoredFCMToken();
          if (fcmToken && otpResponse.user.id) {
            await sendFCMTokenToBackend(otpResponse.user.id, fcmToken);
          }
        } catch (fcmError) {
          console.log('FCM token error (non-critical):', fcmError);
        }
        
        setLoading(false);
        
        // Show login success popup
        showToast("Login Successful! Welcome back! 🎉", "success");
        
        // Navigate to Home after short delay
        setTimeout(() => {
          console.log('🏠🏠🏠 NAVIGATING TO HOME 🏠🏠🏠');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }]
          });
        }, 1500);
        return; // Exit immediately after navigation
      } else {
        // OTP verification failed
        console.log('❌ OTP verification failed');
        setLoading(false);
        showToast(otpResponse.message || "Invalid OTP. Please try again.", "error");
      }
      
    } catch (error) {
      console.error("🔥 OTP Verification Error:", error);
      setLoading(false);
      showToast(error.message || "Invalid OTP. Please try again.", "error");
    }
  };

  // Removed handleRegisterConfirm and handleRegisterCancel - no longer needed
  // OTP verify always goes to Home screen

  const resendOtp = async () => {
    try {
      setResending(true);
      
      // Use authService to resend OTP
      const response = await authService.sendPhoneOtp(phone);
      
      if (response.success) {
        showToast(response.message || "OTP sent successfully! ✅", "success");
        setTimeLeft(300); // Reset timer
        setCanResend(false);
        setOtp(["", "", "", ""]); // Clear current OTP (4 digits)
      } else {
        showToast(response.message || "Failed to resend OTP", "error");
      }
      
      setResending(false);
    } catch (error) {
      console.error("Resend OTP Error:", error);
      setResending(false);
      showToast(error.message || "Failed to resend OTP", "error");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.background}>
      <StatusBar backgroundColor="#F8FAFB" barStyle="dark-content" />
      <View style={styles.overlay}>
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

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/Kirayedar_logo2.png")}
            style={styles.logo}
          />
          <Text style={styles.brandName}>Kirayedar24</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>We sent a 4-digit OTP to {phone}</Text>

          {/* Timer */}
          <View style={styles.timerContainer}>
            {timeLeft > 0 ? (
              <Text style={styles.timerText}>
                Code expires in {formatTime(timeLeft)}
              </Text>
            ) : (
              <Text style={styles.expiredText}>
                Code has expired
              </Text>
            )}
          </View>

          {/* OTP Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  digit && styles.otpBoxFilled
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (
                    nativeEvent.key === "Backspace" &&
                    otp[index] === "" &&
                    index > 0
                  ) {
                    inputs.current[index - 1].focus();
                  }
                }}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity onPress={verifyOtp} disabled={loading}>
            <LinearGradient
              colors={loading ? ["#ccc", "#aaa"] : ["#FDB022", "#FDBF4D"]}
              style={styles.loginBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Verify OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend OTP */}
          <TouchableOpacity
            onPress={resendOtp}
            disabled={!canResend || resending}
            style={styles.resendContainer}
          >
            <Text style={[
              styles.resendText,
              (!canResend || resending) && styles.resendTextDisabled
            ]}>
              {resending ? "Sending..." : canResend ? "Resend OTP" : `Resend in ${formatTime(timeLeft)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Register Modal REMOVED - Direct navigation to Home after OTP verify */}
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F8FAFB' },
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logoContainer: { 
    alignItems: "center", 
    marginBottom: 40,
  },
  logo: { 
    width: 100, 
    height: 100, 
    resizeMode: "contain",
    marginBottom: 16,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 12,
    alignItems: "center",
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
    textAlign: "center",
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    width: "100%",
    paddingHorizontal: 5,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: "#E8F5F0",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    backgroundColor: "#F8FAFB",
    elevation: 2,
    color: "#1A1A1A",
    fontWeight: "800",
    shadowColor: "#FDB022",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  otpBoxFilled: {
    borderColor: "#FDB022",
    backgroundColor: "#FFFFFF",
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  expiredText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "700",
  },
  loginBtn: {
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 18,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    shadowColor: "#FDB022",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  btnText: { 
    color: "#FFFFFF", 
    fontWeight: "800", 
    fontSize: 17,
    letterSpacing: 0.5,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    color: "#FDB022",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
    fontWeight: "700",
  },
  resendTextDisabled: {
    color: "#64748B",
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 350,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C2C2C",
    marginTop: 15,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  modalSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: "#F7B100",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#F7B100",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default OtpScreen;
