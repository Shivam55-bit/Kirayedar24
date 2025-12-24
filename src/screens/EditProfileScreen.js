// EditProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { getCurrentUserProfile, updateCurrentUserProfile, validateProfileData } from '../services/userapi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditProfileScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  // Load profile data on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load user profile from API
      const response = await getCurrentUserProfile();
      
      if (response.success && response.user) {
        const userData = response.user;
        setFullName(userData.fullName || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setState(userData.state || '');
        setCity(userData.city || '');
        setStreet(userData.street || '');
        setPinCode(userData.pinCode || '');
        setPassword(''); // Never pre-fill password
        setProfilePicture(userData.profilePicture || null);
      } else {
        // Fallback to AsyncStorage
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setFullName(user.fullName || user.name || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
          setState(user.state || '');
          setCity(user.city || '');
          setStreet(user.street || '');
          setPinCode(user.pinCode || '');
          setProfilePicture(user.profilePicture || null);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    // Validate profile data using new API validation
    const profileData = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      state: state.trim(),
      city: city.trim(),
      street: street.trim(),
      pinCode: pinCode.trim(),
      ...(password.trim() && { password: password.trim() })
    };

    const validation = validateProfileData(profileData);
    
    if (!validation.isValid) {
      const fieldErrors = {};
      validation.errors.forEach(error => {
        if (error.includes('name')) fieldErrors.fullName = error;
        else if (error.includes('email')) fieldErrors.email = error;
        else if (error.includes('phone')) fieldErrors.phone = error;
        else if (error.includes('state')) fieldErrors.state = error;
        else if (error.includes('city')) fieldErrors.city = error;
        else if (error.includes('PIN')) fieldErrors.pinCode = error;
        else if (error.includes('password')) fieldErrors.password = error;
      });
      setErrors(fieldErrors);
      
      const errorMessages = validation.errors.join('\n');
      Alert.alert('Validation Error', errorMessages);
      return;
    }

    try {
      setSaving(true);
      
      const response = await updateCurrentUserProfile(profileData);
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={require("../assets/profile.png")}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.editAvatar}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="camera-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Card Form */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <View style={styles.inputRow}>
            <Icon name="person-outline" size={20} color="#FF7A00" />
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Email */}
          <View style={styles.inputRow}>
            <Icon name="mail-outline" size={20} color="#FF7A00" />
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              keyboardType="email-address"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputRow}>
            <Icon name="call-outline" size={20} color="#FF7A00" />
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              maxLength={10}
            />
          </View>

          {/* State */}
          <View style={styles.inputRow}>
            <Icon name="location-outline" size={20} color="#FF7A00" />
            <TextInput
              style={[styles.input, errors.state && styles.inputError]}
              value={state}
              onChangeText={setState}
              placeholder="State"
              placeholderTextColor="#999"
            />
          </View>

          {/* City */}
          <View style={styles.inputRow}>
            <Icon name="business-outline" size={20} color="#FF7A00" />
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor="#999"
            />
          </View>

          {/* Street */}
          <View style={styles.inputRow}>
            <Icon name="home-outline" size={20} color="#FF7A00" />
            <TextInput
              style={styles.input}
              value={street}
              onChangeText={setStreet}
              placeholder="Street Address (optional)"
              placeholderTextColor="#999"
            />
          </View>

          {/* PIN Code */}
          <View style={styles.inputRow}>
            <Icon name="pin-outline" size={20} color="#FF7A00" />
            <TextInput
              style={[styles.input, errors.pinCode && styles.inputError]}
              value={pinCode}
              onChangeText={setPinCode}
              placeholder="PIN Code"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          {/* Password */}
          <View style={styles.inputRow}>
            <Icon name="lock-closed-outline" size={20} color="#FF7A00" />
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              placeholder="New Password (optional)"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
            onPress={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Sheet for Avatar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalItem}>
              <Icon name="camera" size={22} color="#FF7A00" />
              <Text style={styles.modalText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem}>
              <Icon name="image" size={22} color="#FF7A00" />
              <Text style={styles.modalText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f5f9" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
  backgroundColor: "#FF7A00",
    padding: 15,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 15,
  },

  // Avatar
  avatarContainer: {
    alignItems: "center",
    marginTop: -40,
    marginBottom: 20,
    paddingTop: 60,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#eee",
    elevation: 4,
  },
  editAvatar: {
    position: "absolute",
    bottom: 0,
    right: "38%",
  backgroundColor: "#FF7A00",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // Form Card
  formCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  // Save button
  saveBtn: {
  backgroundColor: "#FF7A00",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  modalText: { marginLeft: 10, fontSize: 15, color: "#333" },
});

export default EditProfileScreen;
