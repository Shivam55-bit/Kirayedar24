import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const PropertyInquiryFormScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);

  const propertyTypes = [
    "House",
    "Office",
    "Shop",
    "PG"
  ];

  const handleSelectPropertyType = (type) => {
    setPropertyType(type);
    setShowPropertyTypeModal(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Required", "Please enter your phone number");
      return;
    }

    // Remove all non-digit characters
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      Alert.alert("Invalid", "Please enter a valid phone number (at least 10 digits)");
      return;
    }

    // Keep only last 10 digits (in case user entered +91 or country code)
    const formattedPhone = cleanPhone.slice(-10);

    if (!address.trim()) {
      Alert.alert("Required", "Please enter your address");
      return;
    }

    if (!propertyType) {
      Alert.alert("Required", "Please select a property type");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Required", "Please enter your message");
      return;
    }

    setLoading(true);

    // Prepare API payload
    const payload = {
      name: name.trim(),
      phone: formattedPhone,
      address: address.trim(),
      propertyType: propertyType,
      message: message.trim()
    };

    console.log('Submitting payload:', JSON.stringify(payload, null, 2));

    // Send request to API
    fetch('https://n5.bhoomitechzone.us/api/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        console.log('Response status:', response.status);
        return response.json().then((data) => {
          console.log('Response data:', JSON.stringify(data, null, 2));
          if (!response.ok) {
            throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
          }
          return data;
        });
      })
      .then((data) => {
        setLoading(false);
        Alert.alert(
          "Success",
          "Your inquiry has been submitted successfully! The admin will contact you soon.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear form
                setName("");
                setPhoneNumber("");
                setAddress("");
                setPropertyType("");
                setMessage("");
                navigation.goBack();
              }
            }
          ]
        );
      })
      .catch((error) => {
        setLoading(false);
        console.error('API Error:', error);
        Alert.alert(
          "Error",
          `Failed to submit inquiry: ${error.message}`,
          [
            {
              text: "Retry",
              onPress: () => handleSubmit()
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit an Inquiry</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Your Phone Number"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Address Input */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Your Address"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Property Type Dropdown */}
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowPropertyTypeModal(true)}
          >
            <Text style={[styles.dropdownText, propertyType ? { color: "#111827" } : { color: "#9CA3AF" }]}>
              {propertyType || "Select Property Type"}
            </Text>
            <Icon name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {/* Message Input */}
          <View style={styles.messageInputGroup}>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter your message here..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading ? { opacity: 0.7 } : null]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.submitText}>{loading ? "Submitting..." : "Submit Inquiry"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Property Type Modal */}
      <Modal
        visible={showPropertyTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPropertyTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Property Type</Text>
              <TouchableOpacity onPress={() => setShowPropertyTypeModal(false)}>
                <Icon name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={propertyTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleSelectPropertyType(item)}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                  {propertyType === item && (
                    <Icon name="checkmark-circle" size={20} color="#FDB022" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 50,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inputGroup: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: "#111827",
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: "500",
  },
  messageInputGroup: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageInput: {
    fontSize: 15,
    color: "#111827",
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#0066FF",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
});

export default PropertyInquiryFormScreen;
