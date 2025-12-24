import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addProperty } from '../services/api'; // Import the API service
import { getAllStates, getCitiesByState, getAreasByCity, getPincodeByArea } from '../utils/locationData';

// Move Dropdown component outside to prevent recreation
const Dropdown = React.memo(({ options, selectedValue, onSelect, isOpen, setIsOpen, placeholder, icon = "location", searchText, setSearchText }) => {
  const filteredOptions = useMemo(() => 
    options.filter(option => 
      option.toLowerCase().includes(searchText.toLowerCase())
    ), [options, searchText]
  );

  return (
    <View style={dropdownStyles.container}>
      <Text style={dropdownStyles.label}>{placeholder.replace('Select ', '')}</Text>
      <TouchableOpacity
        style={[dropdownStyles.button, isOpen && dropdownStyles.buttonOpen]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <View style={dropdownStyles.buttonContent}>
          <Icon name={icon} size={16} color="#f39c12" style={dropdownStyles.icon} />
          <Text style={[dropdownStyles.buttonText, !selectedValue && dropdownStyles.placeholderText]} numberOfLines={1}>
            {selectedValue || placeholder}
          </Text>
        </View>
        <Icon 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={isOpen ? "#f39c12" : "#666"} 
        />
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={dropdownStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={dropdownStyles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={dropdownStyles.modalHeader}>
              <Text style={dropdownStyles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Icon name="close-circle" size={28} color="#f39c12" />
              </TouchableOpacity>
            </View>
            
            <View style={dropdownStyles.searchContainer}>
              <Icon name="search" size={18} color="#999" />
              <TextInput
                style={dropdownStyles.searchInput}
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
                autoCompleteType="off"
              />
            </View>
            
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => `${item}-${index}`}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={() => (
                <View style={dropdownStyles.noResults}>
                  <Icon name="search" size={32} color="#ccc" />
                  <Text style={dropdownStyles.noResultsText}>No results found</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    dropdownStyles.modalItem,
                    selectedValue === item && dropdownStyles.modalItemSelected
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setIsOpen(false);
                    setSearchText("");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    dropdownStyles.modalItemText,
                    selectedValue === item && dropdownStyles.modalItemTextSelected
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
});

// Move InputField component outside to prevent recreation and keyboard auto-close
const InputField = React.memo(({ label, ...props }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput {...props} style={styles.textInput} />
  </View>
));

// Move other components outside as well
const SectionCard = React.memo(({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Icon name={icon} size={18} color="#f39c12" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
));

const OptionSelector = React.memo(({ options, selectedValue, onSelect }) => (
  <View style={styles.optionRow}>
    {options.map((option) => (
      <TouchableOpacity
        key={option}
        onPress={() => onSelect(option)}
        style={[
          styles.optionPill,
          selectedValue === option && styles.optionPillSelected,
        ]}
      >
        <Text
          style={[
            styles.optionText,
            selectedValue === option && styles.optionTextSelected,
          ]}
        >
          {option}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
));

const CheckboxItem = React.memo(({ label, checked, onToggle }) => (
  <TouchableOpacity style={styles.checkboxRow} onPress={onToggle}>
    <Icon
      name={checked ? "checkbox" : "square-outline"}
      size={22}
      color={checked ? "#f39c12" : "#aaa"}
    />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
));

const ContactOption = React.memo(({ label, icon, checked, onToggle }) => (
  <TouchableOpacity 
    style={[
      styles.contactPill,
      checked && styles.contactPillSelected,
    ]}
    onPress={onToggle}
    activeOpacity={0.8}
  >
    <Icon
      name={icon}
      size={18}
      color={checked ? "#fff" : "#f39c12"}
    />
    <Text style={[
      styles.contactPillText,
      checked && styles.contactPillTextSelected,
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
));

const ContactToggle = React.memo(({ options, selectedOption, onSelect, phoneToggle, onPhoneToggle, whatsappToggle, onWhatsappToggle, chatToggle, onChatToggle }) => (
  <View style={styles.contactToggleContainer}>
    <View style={styles.contactToggleTrack}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.contactToggleOption,
            selectedOption === option.key && styles.contactToggleOptionSelected,
            index === 0 && styles.contactToggleOptionFirst,
            index === options.length - 1 && styles.contactToggleOptionLast,
          ]}
          onPress={() => onSelect(option.key)}
          activeOpacity={0.8}
        >
          <Icon
            name={option.icon}
            size={16}
            color={selectedOption === option.key ? "#fff" : "#f39c12"}
          />
          <Text style={[
            styles.contactToggleText,
            selectedOption === option.key && styles.contactToggleTextSelected,
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    
    <View style={styles.allTogglesContainer}>
      {/* Phone Toggle Switch */}
      <View style={styles.individualToggleContainer}>
        <Icon name="call" size={16} color="#f39c12" />
        <Text style={styles.toggleLabel}>Phone</Text>
        <TouchableOpacity
          style={[
            styles.toggleSwitch,
            phoneToggle && styles.toggleSwitchActive
          ]}
          onPress={onPhoneToggle}
          activeOpacity={0.8}
        >
          <View style={[
            styles.toggleThumb,
            phoneToggle && styles.toggleThumbActive
          ]} />
        </TouchableOpacity>
      </View>

      {/* WhatsApp Toggle Switch */}
      <View style={styles.individualToggleContainer}>
        <Icon name="logo-whatsapp" size={16} color="#f39c12" />
        <Text style={styles.toggleLabel}>WhatsApp</Text>
        <TouchableOpacity
          style={[
            styles.toggleSwitch,
            whatsappToggle && styles.toggleSwitchActive
          ]}
          onPress={onWhatsappToggle}
          activeOpacity={0.8}
        >
          <View style={[
            styles.toggleThumb,
            whatsappToggle && styles.toggleThumbActive
          ]} />
        </TouchableOpacity>
      </View>

      {/* Chat Toggle Switch */}
      <View style={styles.individualToggleContainer}>
        <Icon name="chatbubble" size={16} color="#f39c12" />
        <Text style={styles.toggleLabel}>Chat</Text>
        <TouchableOpacity
          style={[
            styles.toggleSwitch,
            chatToggle && styles.toggleSwitchActive
          ]}
          onPress={onChatToggle}
          activeOpacity={0.8}
        >
          <View style={[
            styles.toggleThumb,
            chatToggle && styles.toggleThumbActive
          ]} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
));

const ContactOptionToggle = React.memo(({ label, enabled, onToggle, icon }) => (
  <View style={styles.contactOptionItem}>
    <View style={styles.contactOptionLabel}>
      <Icon name={icon} size={18} color="#f39c12" />
      <Text style={styles.contactOptionText}>{label}</Text>
    </View>
    <TouchableOpacity
      style={[
        styles.contactOptionToggle,
        enabled && styles.contactOptionToggleActive
      ]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[
        styles.contactOptionThumb,
        enabled && styles.contactOptionThumbActive
      ]} />
    </TouchableOpacity>
  </View>
));

const AddSellScreen = ({ navigation }) => {
  // Multi-step form navigation - ALWAYS call these hooks first in the same order
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // All form state - keep in consistent order
  const [propertyState, setPropertyState] = useState("");
  const [city, setCity] = useState("");
  const [post, setPost] = useState(""); // Post office area
  const [locality, setLocality] = useState(""); // Manual locality/area input
  const [pincode, setPincode] = useState("");
  const [propertyType, setPropertyType] = useState("Residential");
  const [commercialType, setCommercialType] = useState("office");
  const [residentialType, setResidentialType] = useState("Single");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [balconies, setBalconies] = useState(false); // Changed to boolean for Yes/No toggle
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [purpose, setPurpose] = useState("Sell");
  const [parking, setParking] = useState("Available");
  const [furnishing, setFurnishing] = useState("Semi-Furnished");
  const [kitchenType, setKitchenType] = useState("Simple");
  const [availableFrom, setAvailableFrom] = useState(new Date()); // Date picker for available from
  const [availableFor, setAvailableFor] = useState("Boys");
  const [spaceAvailable, setSpaceAvailable] = useState(""); // For commercial
  const [societyMaintenance, setSocietyMaintenance] = useState("Including in Rent"); // Society/Maintenance
  const [societyFeatures, setSocietyFeatures] = useState([]); // Multiple selection: Gym, Lift, Guarded Gated Campus
  const [availability, setAvailability] = useState("Ready to Move"); // Property availability status
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [postDropdownOpen, setPostDropdownOpen] = useState(false);
  const [stateSearchText, setStateSearchText] = useState("");
  const [citySearchText, setCitySearchText] = useState("");
  const [postSearchText, setPostSearchText] = useState("");
  
  // Available options from locationData
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availablePosts, setAvailablePosts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [contactPreference, setContactPreference] = useState("phone");
  const [phoneToggleEnabled, setPhoneToggleEnabled] = useState(true);
  const [whatsappToggleEnabled, setWhatsappToggleEnabled] = useState(true);
  const [chatToggleEnabled, setChatToggleEnabled] = useState(true);
  
  const [contactBy, setContactBy] = useState({
    whatsapp: false,
    phone: false,
    email: false,
  });
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load all states on mount
  React.useEffect(() => {
    const states = getAllStates();
    setAvailableStates(states);
  }, []);

  // Update cities when state changes
  React.useEffect(() => {
    if (propertyState) {
      const cities = getCitiesByState(propertyState);
      setAvailableCities(cities);
      // Reset dependent fields when state changes
      if (city && !cities.includes(city)) {
        setCity("");
        setPost("");
        setLocality("");
        setPincode("");
      }
    } else {
      setAvailableCities([]);
      setCity("");
      setPost("");
      setLocality("");
      setPincode("");
    }
  }, [propertyState]);

  // Update posts (areas) when city changes
  React.useEffect(() => {
    if (city) {
      const posts = getAreasByCity(city);
      setAvailablePosts(posts);
      // Reset dependent fields when city changes
      setPost("");
      setLocality("");
      setPincode("");
    } else {
      setAvailablePosts([]);
      setPost("");
      setLocality("");
      setPincode("");
    }
  }, [city]);

  // Auto-fill pincode when post is selected
  React.useEffect(() => {
    if (city && post) {
      const pincode = getPincodeByArea(city, post);
      if (pincode) {
        setPincode(pincode);
      }
    }
  }, [post, city]);

  // Debug function to test API directly
  const testAPI = async () => {
    console.log('🧪 Testing API directly...');
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token length:', token?.length || 0);
      
      if (!token) {
        console.log('❌ No token found');
        Alert.alert('Error', 'No authentication token found. Please login first.');
        return;
      }

      // Create minimal test FormData with schema-compliant values
      const testFormData = new FormData();
      // Test FormData with backend-compatible flat address fields
      testFormData.append('state', 'TestState');
      testFormData.append('city', 'TestCity');
      testFormData.append('locality', 'TestLocality');
      testFormData.append('pincode', '123456');
      testFormData.append('propertyLocation', 'TestLocality, TestCity, TestState - 123456');
      testFormData.append('areaDetails', 1000);
      testFormData.append('price', 50000);
      testFormData.append('propertyType', 'Residential');
      testFormData.append('residentialType', 'Apartment');
      testFormData.append('purpose', 'Sell');
      testFormData.append('contactNumber', '9876543210');
      testFormData.append('bedrooms', 2);
      testFormData.append('bathrooms', 1);
      testFormData.append('balconies', 1);
      testFormData.append('facingDirection', 'North');
      testFormData.append('furnishingStatus', 'Semi-Furnished');
      testFormData.append('parking', 'Available');
      testFormData.append('availability', 'Ready to Move'); // Schema-compliant enum value
      testFormData.append('description', 'Test property description');
      testFormData.append('floorNumber', 2); // Required for Residential non-Plot
      testFormData.append('totalFloors', 5); // Required for Residential non-Plot

      console.log('📦 Making test API call...');
      
      const response = await fetch('https://n5.bhoomitechzone.us/property/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: testFormData
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);
      
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('✅ Parsed response:', jsonResponse);
        Alert.alert('Test Result', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('❌ Response is not JSON');
        Alert.alert('Test Result', `Status: ${response.status}\n\nResponse: ${responseText.substring(0, 200)}...`);
      }

    } catch (error) {
      console.error('🔥 Test API error:', error);
      Alert.alert('Test Error', error.message);
    }
  };

  const toggleContactBy = useCallback((key) =>
    setContactBy((p) => ({ ...p, [key]: !p[key] })), []);

  // Step Navigation Functions - wrapped in useCallback
  const validateStep1 = useCallback(() => {
    if (!propertyState?.trim()) {
      Alert.alert('Missing Information', 'Please select State');
      return false;
    }
    if (!city?.trim()) {
      Alert.alert('Missing Information', 'Please select City');
      return false;
    }
    if (!post?.trim()) {
      Alert.alert('Missing Information', 'Please select Post');
      return false;
    }
    if (!locality?.trim()) {
      Alert.alert('Missing Information', 'Please enter Locality/Area');
      return false;
    }
    if (!pincode?.trim() || !/^\d{6}$/.test(pincode.trim())) {
      Alert.alert('Invalid PIN Code', 'Please enter a valid 6-digit PIN code');
      return false;
    }
    return true;
  }, [propertyState, city, post, locality, pincode]);

  const validateStep2 = useCallback(() => {
    if (!area?.trim() || isNaN(parseInt(area)) || parseInt(area) <= 0) {
      Alert.alert('Invalid Area', 'Please enter a valid area in sq ft');
      return false;
    }
    if (!price?.trim() || isNaN(parseInt(price)) || parseInt(price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return false;
    }
    if (!contactNumber?.trim() || !/^\d{10}$/.test(contactNumber.trim())) {
      Alert.alert('Invalid Contact', 'Please enter a valid 10-digit contact number');
      return false;
    }
    if (propertyType === 'Residential' && (residentialType === 'Apartment' || residentialType === 'Villa')) {
      if (!floorNumber?.trim() || isNaN(parseInt(floorNumber)) || parseInt(floorNumber) < 1) {
        Alert.alert('Missing Floor Number', 'Please enter a valid floor number');
        return false;
      }
      if (!totalFloors?.trim() || isNaN(parseInt(totalFloors)) || parseInt(totalFloors) < 1) {
        Alert.alert('Missing Total Floors', 'Please enter valid total floors');
        return false;
      }
      if (parseInt(floorNumber) > parseInt(totalFloors)) {
        Alert.alert('Invalid Floor Numbers', 'Floor number cannot be greater than total floors');
        return false;
      }
    }
    return true;
  }, [area, price, contactNumber, propertyType, residentialType, floorNumber, totalFloors]);

  const nextStep = useCallback(() => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  }, [currentStep, validateStep1, validateStep2]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const getStepTitle = useCallback(() => {
    switch (currentStep) {
      case 1: return 'Property Address';
      case 2: return 'Property & Contact Details';
      case 3: return 'Availability & Media';
      default: return 'Add Property';
    }
  }, [currentStep]);

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to camera to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleMediaPicker = () => {
    Alert.alert(
      "Add Media",
      "Choose photos or videos for your property",
      [
        {
          text: "Camera",
          onPress: () => openCamera()
        },
        {
          text: "Gallery", 
          onPress: () => openGallery()
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return;
    }

    const options = {
      mediaType: 'mixed',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    setUploadingMedia(true);
    launchCamera(options, (response) => {
      setUploadingMedia(false);
      
      if (response.didCancel) {
        return;
      }
      
      if (response.error) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }
      
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (asset.fileSize > maxSize) {
          Alert.alert('File Too Large', 'Captured file is larger than 10MB. Please try again.');
          return;
        }
        
        // Check total number of files
        if (selectedMedia.length >= 10) {
          Alert.alert('Too Many Files', 'You can upload maximum 10 files.');
          return;
        }
        
        const newMedia = {
          id: Date.now().toString(),
          type: asset.type?.includes('video') ? 'video' : 'photo',
          uri: asset.uri,
          name: asset.fileName || `camera_${Date.now()}.${asset.type?.includes('video') ? 'mp4' : 'jpg'}`,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
        };
        setSelectedMedia(prev => [...prev, newMedia]);
      }
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: 'mixed',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      selectionLimit: 10, // Allow multiple selections
    };

    setUploadingMedia(true);
    launchImageLibrary(options, (response) => {
      setUploadingMedia(false);
      
      if (response.didCancel) {
        return;
      }
      
      if (response.error) {
        Alert.alert('Error', 'Failed to select media from gallery');
        return;
      }
      
      if (response.assets) {
        const newMediaItems = response.assets
          .filter(asset => {
            // Check file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (asset.fileSize > maxSize) {
              Alert.alert('File Too Large', `File ${asset.fileName} is larger than 10MB. Please select a smaller file.`);
              return false;
            }
            return true;
          })
          .map(asset => ({
            id: Date.now().toString() + Math.random(),
            type: asset.type?.includes('video') ? 'video' : 'photo',
            uri: asset.uri,
            name: asset.fileName || `gallery_${Date.now()}.${asset.type?.includes('video') ? 'mp4' : 'jpg'}`,
            fileSize: asset.fileSize,
            width: asset.width,
            height: asset.height,
          }));
        
        // Check total number of files
        if (selectedMedia.length + newMediaItems.length > 10) {
          Alert.alert('Too Many Files', 'You can upload maximum 10 files.');
          return;
        }
        
        setSelectedMedia(prev => [...prev, ...newMediaItems]);
      }
    });
  };

  const removeMedia = (id) => {
    setSelectedMedia(prev => prev.filter(media => media.id !== id));
  };

  const handleSubmit = async () => {
    console.log('🚀 Starting property submission validation...');
    
    // =============================================================================
    // COMPREHENSIVE FRONTEND VALIDATION (Prevents backend validation errors)
    // =============================================================================
    
    // 1. REQUIRED FIELDS VALIDATION - Backend schema requirements
    const requiredFields = [
      { value: propertyState, name: "State", field: "address.state" },
      { value: city, name: "City", field: "address.city" },
      { value: post, name: "Post", field: "address.post" },
      { value: locality, name: "Locality/Area", field: "address.locality" },
      { value: pincode, name: "PIN Code", field: "address.pincode" },
      { value: area, name: "Area", field: "areaDetails" },
      { value: price, name: "Price", field: "price" },
      { value: contactNumber, name: "Contact Number", field: "contactNumber" },
    ];

    // CRITICAL: Address fields validation - Backend requires nested address object
    const addressValidation = {
      state: propertyState?.trim() || '',
      city: city?.trim() || '',
      locality: locality?.trim() || '', // This is the manual input, not the post dropdown
      pincode: pincode?.trim() || ''
    };

    console.log('🔍 Address validation check:');
    Object.entries(addressValidation).forEach(([key, value]) => {
      console.log(`  - ${key}: "${value}" (length: ${value.length})`);
    });

    // Validate each address field individually (including post for UI validation)
    const addressErrors = [];
    if (!addressValidation.state) addressErrors.push('State');
    if (!addressValidation.city) addressErrors.push('City');
    if (!post?.trim()) addressErrors.push('Post'); // Validate post but don't send to backend
    if (!addressValidation.locality) addressErrors.push('Locality/Area');
    if (!addressValidation.pincode || !/^\d{6}$/.test(addressValidation.pincode)) addressErrors.push('PIN Code (6 digits)');

    if (addressErrors.length > 0) {
      Alert.alert(
        "Missing Address Information", 
        `Please provide: ${addressErrors.join(', ')}`
      );
      console.log('❌ Address validation failed:', addressErrors);
      return;
    }

    // Check for empty/missing required fields
    const missingFields = requiredFields.filter(field => {
      if (!field.value) return true;
      if (typeof field.value === 'string' && (!field.value.trim() || field.value.trim().length === 0)) return true;
      return false;
    });
    
    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map(field => `• ${field.name}`).join("\n");
      Alert.alert(
        "Required Fields Missing", 
        `Please fill the following required fields:\n\n${missingFieldNames}`,
        [{ text: "OK", style: "default" }]
      );
      console.log('❌ Validation failed: Missing required fields:', missingFields.map(f => f.field));
      return;
    }

    // 2. FIELD FORMAT VALIDATION
    
    // Contact number validation (exactly 10 digits)
    if (!contactNumber || !/^\d{10}$/.test(contactNumber.trim())) {
      Alert.alert("Invalid Contact Number", "Contact number must be exactly 10 digits");
      console.log('❌ Validation failed: Invalid contact number format:', contactNumber);
      return;
    }
    


    // 3. NUMERIC FIELD VALIDATION (Prevent NaN errors)
    
    const areaNum = parseInt(area);
    const priceNum = parseInt(price);
    
    if (!area || isNaN(areaNum) || areaNum <= 0) {
      Alert.alert("Invalid Area", "Please enter a valid area in sq ft (must be greater than 0)");
      console.log('❌ Validation failed: Invalid area:', area, 'parsed:', areaNum);
      return;
    }

    if (!price || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price (must be greater than 0)");
      console.log('❌ Validation failed: Invalid price:', price, 'parsed:', priceNum);
      return;
    }

    // 4. PROPERTY TYPE SPECIFIC VALIDATION
    
    if (propertyType === 'Residential') {
      // Validate residential type is selected
      if (!residentialType) {
        Alert.alert("Missing Selection", "Please select a residential type (Apartment/Villa/Plot)");
        console.log('❌ Validation failed: Missing residential type');
        return;
      }
      
      // Validate bedrooms/bathrooms for residential properties
      const bedroomsNum = parseInt(bedrooms);
      const bathroomsNum = parseInt(bathrooms);
      
      if (!bedrooms || isNaN(bedroomsNum) || bedroomsNum < 1) {
        Alert.alert("Invalid Bedrooms", "Bedrooms must be at least 1 for residential properties");
        console.log('❌ Validation failed: Invalid bedrooms:', bedrooms);
        return;
      }
      
      if (!bathrooms || isNaN(bathroomsNum) || bathroomsNum < 1) {
        Alert.alert("Invalid Bathrooms", "Bathrooms must be at least 1 for residential properties");
        console.log('❌ Validation failed: Invalid bathrooms:', bathrooms);
        return;
      }
      
      // CRITICAL: Floor validation for Single/Duplex/Flat (Backend schema requirement)
      if (residentialType === 'Single' || residentialType === 'Duplex' || residentialType === 'Flat') {
        const floorNum = parseInt(floorNumber);
        const totalFloorNum = parseInt(totalFloors);
        
        if (!floorNumber || isNaN(floorNum) || floorNum < 1) {
          Alert.alert("Missing Floor Number", `Floor Number is required for ${residentialType} properties and must be at least 1`);
          console.log('❌ Validation failed: Invalid floor number for', residentialType, ':', floorNumber);
          return;
        }
        
        if (!totalFloors || isNaN(totalFloorNum) || totalFloorNum < 1) {
          Alert.alert("Missing Total Floors", `Total Floors is required for ${residentialType} properties and must be at least 1`);
          console.log('❌ Validation failed: Invalid total floors for', residentialType, ':', totalFloors);
          return;
        }
        
        if (floorNum > totalFloorNum) {
          Alert.alert("Invalid Floor Numbers", "Floor Number cannot be greater than Total Floors");
          console.log('❌ Validation failed: Floor number greater than total floors:', floorNum, '>', totalFloorNum);
          return;
        }
      }
      
    } else if (propertyType === 'Commercial') {
      // Validate commercial type is selected
      if (!commercialType) {
        Alert.alert("Missing Selection", "Please select a commercial type (office/shop/warehouse)");
        console.log('❌ Validation failed: Missing commercial type');
        return;
      }
      
      // Validate space available for commercial
      const spaceNum = parseInt(spaceAvailable);
      if (!spaceAvailable || isNaN(spaceNum) || spaceNum <= 0) {
        Alert.alert("Invalid Space", "Please enter valid space available in sq ft");
        console.log('❌ Validation failed: Invalid space available:', spaceAvailable);
        return;
      }
    }

    console.log('✅ All frontend validation passed successfully!');
    console.log('📋 Validated field values:', {
      address: addressValidation, // Use validated address object
      areaDetails: areaNum,
      price: priceNum,
      propertyType,
      contactNumber
    });
    
    // Show payment modal after validation passes
    setShowPaymentModal(true);
  };
  
  // New function to handle actual property submission after payment
  const handlePropertySubmission = async () => {
    console.log('🔍 DEBUG: Current state values:');
    console.log('  propertyState:', propertyState);
    console.log('  city:', city);
    console.log('  locality:', locality);
    console.log('  post:', post);
    console.log('  pincode:', pincode);
    
    const addressValidation = {
      state: propertyState?.trim() || '',
      city: city?.trim() || '',
      locality: locality?.trim() || '',
      pincode: pincode?.trim() || ''
    };
    
    console.log('📦 Address validation object:', addressValidation);
    
    const areaNum = parseInt(area);
    const priceNum = parseInt(price);
    
    // =============================================================================
    // FORMDATA CONSTRUCTION (Exact backend schema match)
    // =============================================================================
    
    setSubmitting(true);
    setProcessingPayment(true);
    
    try {
      const formData = new FormData();
      
      // ================================================================================================
      // CRITICAL: ADDRESS FIELDS - Backend controller expects flat fields
      // Backend destructures: const { state, city, locality, pincode } = req.body;
      // ================================================================================================
      
      // Send ONLY flat address fields (remove JSON approach)
      formData.append('state', addressValidation.state);
      formData.append('city', addressValidation.city);
      formData.append('locality', addressValidation.locality);
      formData.append('post', post || ''); // Post office area
      formData.append('pincode', addressValidation.pincode);
      
      console.log('📦 FormData Address Fields (Flat - Backend Compatible):');
      console.log(`  ✅ state: "${addressValidation.state}"`);
      console.log(`  ✅ city: "${addressValidation.city}"`);
      console.log(`  ✅ locality: "${addressValidation.locality}"`);
      console.log(`  ✅ post: "${post}"`);
      console.log(`  ✅ pincode: "${addressValidation.pincode}"`);
      
      // Required core fields - Backend schema requirements
      formData.append('areaSqFt', areaNum);              // ✅ FIXED: Backend expects areaSqFt
      formData.append('price', priceNum);                // Must be Number (not string)
      formData.append('contactNumber', contactNumber.trim());
      formData.append('propertyType', propertyType);     // "Residential" or "Commercial"
      formData.append('purpose', purpose);               // "Sell", "Rent", "Paying Guest"
      formData.append('furnishingStatus', furnishing);   // Backend expects "furnishingStatus"
      formData.append('parking', parking);               // "Available" or "Not Available"
      
      // Kitchen Type - Only for Residential
      if (propertyType === 'Residential') {
        formData.append('kitchenType', kitchenType);     // "Modular" or "Simple"
      }
      
      // ✅ FIXED: Backend expects availabilityStatus not availability
      formData.append('availabilityStatus', availability); // "Ready to Move" or "Under Construction"
      
      // Available From Date
      formData.append('availableFrom', availableFrom.toISOString().split('T')[0]); // YYYY-MM-DD format
      
      // Available For - Only for non-Sell purposes
      if (purpose !== 'Sell') {
        formData.append('availableFor', availableFor); // "Boys", "Girls", "Family"
      }
      
      // Society/Maintenance - Only for Residential
      if (propertyType === 'Residential') {
        formData.append('societyMaintenance', societyMaintenance); // "Including in Rent" or "Excluding"
        
        // Society Features - Send as individual array items
        if (societyFeatures.length > 0) {
          societyFeatures.forEach(feature => {
            formData.append('societyFeatures[]', feature);
          });
        }
      }
      
      // Contact Preferences
      formData.append('contactPreferences[phone]', phoneToggleEnabled.toString());
      formData.append('contactPreferences[whatsapp]', whatsappToggleEnabled.toString());
      formData.append('contactPreferences[chat]', chatToggleEnabled.toString());
      
      // Description field (optional)
      if (description?.trim()) {
        formData.append('description', description.trim());
      }
      
      // Property type specific fields
      if (propertyType === 'Residential') {
        // ✅ FIXED: Backend expects specificType not residentialType
        formData.append('specificType', residentialType);     // "Single", "Duplex", "Room", "Flat", "PG"
        formData.append('bedrooms', parseInt(bedrooms));      // Must be Number
        formData.append('bathrooms', parseInt(bathrooms));    // Must be Number
        formData.append('balconies', balconies.toString());   // ✅ FIXED: Send as Boolean string
        
        // ✅ CRITICAL FIX: Floor fields - Backend requires for ALL residential types (not just some)
        // Backend schema: required if specificType !== "Plot"
        // Since we don't have Plot option, always send floor fields
        if (floorNumber?.trim() && totalFloors?.trim()) {
          formData.append('floorNumber', parseInt(floorNumber));   // Required Number
          formData.append('totalFloors', parseInt(totalFloors));  // Required Number
        }
        
        console.log('🏠 Added residential fields:', {
          residentialType,
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          balconies: balconies.toString(),
          floorNumber: floorNumber ? parseInt(floorNumber) : 'Not provided',
          totalFloors: totalFloors ? parseInt(totalFloors) : 'Not provided'
        });
        
      } else if (propertyType === 'Commercial') {
        // ✅ FIXED: Backend expects specificType not commercialType
        // Capitalize first letter to match backend enum: Office, Shop, Warehouse
        const formattedCommercialType = commercialType.charAt(0).toUpperCase() + commercialType.slice(1);
        formData.append('specificType', formattedCommercialType); // "Office", "Shop", "Warehouse"
        formData.append('spaceAvailable', parseInt(spaceAvailable)); // Space in sq ft
        
        console.log('🏢 Added commercial fields:', { 
          commercialType,
          spaceAvailable: parseInt(spaceAvailable)
        });
      }
      
      // ✅ FIXED: Media files - Backend expects 'photos' and 'videos' separately
      let photoCount = 0;
      let videoCount = 0;
      selectedMedia.forEach((media, index) => {
        if (media.uri) {
          const fileExtension = media.type === 'photo' ? 'jpg' : 'mp4';
          const fileName = media.name || `media_${index}.${fileExtension}`;
          
          // Append photos and videos to separate fields
          const fieldName = media.type === 'photo' ? 'photos' : 'videos';
          formData.append(fieldName, {
            uri: media.uri,
            type: media.type === 'photo' ? 'image/jpeg' : 'video/mp4',
            name: fileName
          });
          
          if (media.type === 'photo') photoCount++;
          else videoCount++;
        }
      });
      
      const mediaCount = photoCount + videoCount;
      
      // Final payload verification log
      console.log('🔍 FINAL PAYLOAD VERIFICATION:');
      console.log('═══════════════════════════════════════');
      console.log('✓ Address Fields:');
      console.log(`  - state: "${addressValidation.state}"`);
      console.log(`  - city: "${addressValidation.city}"`);
      console.log(`  - locality: "${addressValidation.locality}"`);
      console.log(`  - post: "${post}"`);
      console.log(`  - pincode: "${addressValidation.pincode}"`);
      console.log('✓ Property Details:');
      console.log(`  - propertyType: "${propertyType}"`);
      console.log(`  - specificType: "${propertyType === 'Residential' ? residentialType : commercialType}"`);
      console.log(`  - areaSqFt: ${areaNum} (${typeof areaNum})`);
      console.log(`  - price: ${priceNum} (${typeof priceNum})`);
      console.log('✓ Availability:');
      console.log(`  - availabilityStatus: "${availability}" (Valid: ${['Ready to Move', 'Under Construction'].includes(availability)})`);
      console.log(`  - availableFrom: "${availableFrom.toISOString().split('T')[0]}"`);
      console.log('✓ Media Files:');
      console.log(`  - photos: ${photoCount}, videos: ${videoCount} (total: ${mediaCount})`);
      console.log('═══════════════════════════════════════');

      // =============================================================================
      // API CALL (Using centralized service)
      // =============================================================================
      
      console.log('🚀 Submitting to backend API...');
      const result = await addProperty(formData);
      
      if (result.success) {
        console.log('✅ Property submitted successfully!');
        console.log('📄 Property data:', result.property);
        
        // Close payment modal
        setShowPaymentModal(false);
        setProcessingPayment(false);
        
        Alert.alert(
          "Success", 
          "Property added successfully and is pending verification!", 
          [
            {
              text: "View My Properties", 
              onPress: () => {
                navigation.navigate('MyPropertyScreen', { refresh: true, timestamp: Date.now() });
              }
            }
          ]
        );
        
      } else {
        console.error('❌ Property submission failed:', result);
        
        // Enhanced error handling with specific messages
        let errorMessage = "Failed to add property. Please try again.";
        
        if (result.message) {
          errorMessage = result.message;
        } else if (result.error) {
          errorMessage = result.error;
        } else if (result.rawResponse && result.rawResponse.includes('validation')) {
          errorMessage = "Data validation failed. Please check all required fields.";
        } else if (result.status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (result.status === 400) {
          errorMessage = "Invalid data format. Please verify all fields.";
        } else if (result.status === 422) {
          errorMessage = "Server validation error. Please check your input.";
        } else if (result.isNetworkError) {
          errorMessage = "Network error. Please check your internet connection.";
        }
        
        Alert.alert(
          "Property Submission Failed", 
          errorMessage,
          [{ text: "OK", style: "default" }]
        );
      }
      
    } catch (error) {
      console.error('🔥 Submit error:', error);
      Alert.alert(
        "Submission Error", 
        "Network error occurred. Please check your connection and try again.",
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setSubmitting(false);
    }
  };
      console.log('� Contact:', contactNumber);
      console.log('📅 Availability:', selectedDate.toLocaleDateString('en-IN'));
      console.log('🖼️ Media files:', selectedMedia.length);
      
      // API Call using centralized service
      console.log('🚀 Making API call using service...');
      console.log('📦 FormData total fields being sent');

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f9d976", "#f39c12"]} style={styles.header}>
        <TouchableOpacity onPress={currentStep === 1 ? () => navigation.goBack() : prevStep}>
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          <Text style={styles.headerSubtitle}>Step {currentStep} of {totalSteps}</Text>
        </View>
      </LinearGradient>

      {/* Step Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressItem}>
            <View style={[
              styles.progressCircle, 
              currentStep >= step && styles.progressCircleActive
            ]}>
              <Text style={[
                styles.progressText,
                currentStep >= step && styles.progressTextActive
              ]}>{step}</Text>
            </View>
            {step < totalSteps && (
              <View style={[
                styles.progressLine,
                currentStep > step && styles.progressLineActive
              ]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Step 1: Property Address */}
        {currentStep === 1 && (
          <SectionCard title="Property Address" icon="location-outline">
            <Dropdown
              options={availableStates}
              selectedValue={propertyState}
              onSelect={setPropertyState}
              isOpen={stateDropdownOpen}
              setIsOpen={(val) => {
                setStateDropdownOpen(val);
                if (val) {
                  setCityDropdownOpen(false);
                  setPostDropdownOpen(false);
                }
              }}
              placeholder="Select State"
              icon="map"
              searchText={stateSearchText}
              setSearchText={setStateSearchText}
            />
            <Dropdown
              options={availableCities}
              selectedValue={city}
              onSelect={setCity}
              isOpen={cityDropdownOpen}
              setIsOpen={(val) => {
                setCityDropdownOpen(val);
                if (val) {
                  setStateDropdownOpen(false);
                  setPostDropdownOpen(false);
                }
              }}
              placeholder={propertyState ? "Select City/District" : "Select state first"}
              icon="business"
              searchText={citySearchText}
              setSearchText={setCitySearchText}
            />
            <Dropdown
              options={availablePosts.map(post => post.name)}
              selectedValue={post}
              onSelect={setPost}
              isOpen={postDropdownOpen}
              setIsOpen={(val) => {
                setPostDropdownOpen(val);
                if (val) {
                  setStateDropdownOpen(false);
                  setCityDropdownOpen(false);
                }
              }}
              placeholder={city ? "Select Post" : "Select city first"}
              icon="mail"
              searchText={postSearchText}
              setSearchText={setPostSearchText}
            />
            <InputField
              label="PIN Code*"
              placeholder="Auto-filled (or enter manually)"
              keyboardType="numeric"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
            <InputField
              label="Locality/Area*"
              placeholder="Enter locality or area name"
              value={locality}
              onChangeText={setLocality}
            />
          </SectionCard>
        )}

        {/* Step 2: Basic Details + Contact Details */}
        {currentStep === 2 && (
          <>
            <SectionCard title="Property Details" icon="home-outline">
              <Text style={styles.fieldLabel}>Property Type</Text>
              <OptionSelector
                options={["Commercial", "Residential"]}
                selectedValue={propertyType}
                onSelect={setPropertyType}
              />

              {propertyType === "Commercial" && (
                <>
                  <Text style={styles.fieldLabel}>Commercial Type</Text>
                  <OptionSelector
                    options={["office", "shop", "warehouse"]}
                    selectedValue={commercialType}
                    onSelect={setCommercialType}
                  />
                  
                  <InputField
                    label="Space Available (sq ft)*"
                    placeholder="Enter space available"
                    keyboardType="numeric"
                    value={spaceAvailable}
                    onChangeText={setSpaceAvailable}
                  />
                </>
              )}

              {propertyType === "Residential" && (
                <>
                  <Text style={styles.fieldLabel}>Residential Type</Text>
                  <OptionSelector
                    options={["Single", "Duplex", "Room", "Flat", "PG"]}
                    selectedValue={residentialType}
                    onSelect={setResidentialType}
                  />

                  <Text style={styles.fieldLabel}>Bedrooms</Text>
                  <OptionSelector
                    options={["1", "2", "3", "4", "5+"]}
                    selectedValue={bedrooms}
                    onSelect={setBedrooms}
                  />

                  <Text style={styles.fieldLabel}>Bathrooms</Text>
                  <OptionSelector
                    options={["1", "2", "3", "4", "5+"]}
                    selectedValue={bathrooms}
                    onSelect={setBathrooms}
                  />

                  {/* Balconies Toggle */}
                  <View style={styles.toggleFieldContainer}>
                    <Text style={styles.fieldLabel}>Balconies</Text>
                    <View style={styles.toggleSwitch}>
                      <Text style={styles.toggleText}>{balconies ? "Yes" : "No"}</Text>
                      <TouchableOpacity
                        style={[styles.toggleButton, balconies && styles.toggleButtonActive]}
                        onPress={() => setBalconies(!balconies)}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.toggleThumb,
                          balconies && styles.toggleThumbActive
                        ]} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Floor fields - Always show for all residential types (backend requirement) */}
                  <InputField
                    label="Floor Number*"
                    placeholder="Enter floor number"
                    keyboardType="numeric"
                    value={floorNumber}
                    onChangeText={setFloorNumber}
                  />

                  <InputField
                    label="Total Floors*"
                    placeholder="Enter total floors in building"
                    keyboardType="numeric"
                    value={totalFloors}
                    onChangeText={setTotalFloors}
                  />
                </>
              )}

              <InputField
                label="Area (sq ft)*"
                placeholder="Enter area"
                keyboardType="numeric"
                value={area}
                onChangeText={setArea}
              />

              <InputField
                label="Price (₹)*"
                placeholder="Enter price in INR"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.fieldLabel}>Kitchen Type</Text>
              <OptionSelector
                options={["Modular", "Simple"]}
                selectedValue={kitchenType}
                onSelect={setKitchenType}
              />

              <Text style={styles.fieldLabel}>Furnishing Status</Text>
              <OptionSelector
                options={["Furnished", "Semi-Furnished", "Unfurnished"]}
                selectedValue={furnishing}
                onSelect={setFurnishing}
              />

              <Text style={styles.fieldLabel}>Parking</Text>
              <OptionSelector
                options={["Available", "Not Available"]}
                selectedValue={parking}
                onSelect={setParking}
              />
              
              {/* Available From Date Picker */}
              <View style={styles.datePickerContainer}>
                <Text style={styles.fieldLabel}>Available From</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setDatePickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <Icon name="calendar-outline" size={20} color="#f39c12" />
                  <Text style={styles.datePickerText}>
                    {availableFrom.toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <DatePicker
                modal
                open={datePickerOpen}
                date={availableFrom}
                mode="date"
                minimumDate={new Date()}
                onConfirm={(date) => {
                  setDatePickerOpen(false);
                  setAvailableFrom(date);
                }}
                onCancel={() => {
                  setDatePickerOpen(false);
                }}
              />
              
              {propertyType === "Residential" && (
                <>
                  <Text style={styles.fieldLabel}>Available For</Text>
                  <OptionSelector
                    options={["Boys", "Girls", "Family"]}
                    selectedValue={availableFor}
                    onSelect={setAvailableFor}
                  />
                  
                  {/* Society/Maintenance */}
                  <Text style={styles.fieldLabel}>Society/Maintenance</Text>
                  <OptionSelector
                    options={["Including in Rent", "Excluding"]}
                    selectedValue={societyMaintenance}
                    onSelect={setSocietyMaintenance}
                  />
                  
                  {/* Society Features - Multiple Selection */}
              <Text style={styles.fieldLabel}>Society Features</Text>
              <View style={styles.societyFeaturesContainer}>
                {["Gym", "Lift", "Guarded Gated Campus"].map((feature) => (
                  <TouchableOpacity
                    key={feature}
                    style={[
                      styles.featureChip,
                      societyFeatures.includes(feature) && styles.featureChipSelected
                    ]}
                    onPress={() => {
                      if (societyFeatures.includes(feature)) {
                        setSocietyFeatures(societyFeatures.filter(f => f !== feature));
                      } else {
                        setSocietyFeatures([...societyFeatures, feature]);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon 
                      name={societyFeatures.includes(feature) ? "checkmark-circle" : "ellipse-outline"} 
                      size={18} 
                      color={societyFeatures.includes(feature) ? "#fff" : "#f39c12"} 
                    />
                    <Text style={[
                      styles.featureChipText,
                      societyFeatures.includes(feature) && styles.featureChipTextSelected
                    ]}>
                      {feature}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
                </>
              )}
            </SectionCard>
            
            <SectionCard title="Contact Details" icon="call-outline">
              <InputField
                label="Contact Number*"
                placeholder="Enter your contact number"
                keyboardType="phone-pad"
                maxLength={10}
                value={contactNumber}
                onChangeText={setContactNumber}
              />

              <Text style={styles.fieldLabel}>Contact Preference</Text>
              <View style={styles.allTogglesContainer}>
                {/* Phone Toggle Switch */}
                <View style={styles.individualToggleContainer}>
                  <Icon name="call" size={16} color="#f39c12" />
                  <Text style={styles.toggleLabel}>Phone</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      phoneToggleEnabled && styles.toggleSwitchActive
                    ]}
                    onPress={() => setPhoneToggleEnabled(!phoneToggleEnabled)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.toggleThumb,
                      phoneToggleEnabled && styles.toggleThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>

                {/* WhatsApp Toggle Switch */}
                <View style={styles.individualToggleContainer}>
                  <Icon name="logo-whatsapp" size={16} color="#f39c12" />
                  <Text style={styles.toggleLabel}>WhatsApp</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      whatsappToggleEnabled && styles.toggleSwitchActive
                    ]}
                    onPress={() => setWhatsappToggleEnabled(!whatsappToggleEnabled)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.toggleThumb,
                      whatsappToggleEnabled && styles.toggleThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>

                {/* Chat Toggle Switch */}
                <View style={styles.individualToggleContainer}>
                  <Icon name="chatbubble" size={16} color="#f39c12" />
                  <Text style={styles.toggleLabel}>Chat</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      chatToggleEnabled && styles.toggleSwitchActive
                    ]}
                    onPress={() => setChatToggleEnabled(!chatToggleEnabled)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.toggleThumb,
                      chatToggleEnabled && styles.toggleThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>
            </SectionCard>
          </>
        )}

        {/* Step 3: Availability + Media */}
        {currentStep === 3 && (
          <>
            <SectionCard title="Availability" icon="calendar-outline">
              <Text style={styles.fieldLabel}>Property Status</Text>
              <OptionSelector
                options={["Ready to Move", "Under Construction"]}
                selectedValue={availability}
                onSelect={setAvailability}
              />

              {/* <Text style={styles.fieldLabel}>Available For</Text>
              <OptionSelector
                options={["Family", "Students", "Bachelor", "Any"]}
                selectedValue={availableFor}
                onSelect={setAvailableFor}
              /> */}
            </SectionCard>

            {/* PROPERTY DESCRIPTION SECTION */}
            <SectionCard title="Property Description" icon="document-text-outline">
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Enter detailed property description..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </SectionCard>

            {/* MEDIA UPLOAD SECTION */}
            <SectionCard title="Property Media" icon="camera-outline">
              <Text style={styles.fieldLabel}>Photos & Videos</Text>
              
              {/* Upload Button */}
              <TouchableOpacity 
                style={styles.mediaUploadButton} 
                onPress={handleMediaPicker}
                disabled={uploadingMedia}
              >
                {uploadingMedia ? (
                  <ActivityIndicator color="#f39c12" size="small" />
                ) : (
                  <>
                    <Icon name="cloud-upload-outline" size={24} color="#f39c12" />
                    <Text style={styles.mediaUploadText}>Add Photos/Videos</Text>
                    <Text style={styles.mediaUploadSubtext}>Tap to upload from camera or gallery</Text>
                    <Text style={styles.mediaUploadSubtext}>Max 10 files, 10MB each</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Media Preview Grid */}
              {selectedMedia.length > 0 && (
                <View style={styles.mediaGrid}>
                  <Text style={styles.mediaGridTitle}>Selected Media ({selectedMedia.length})</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.mediaScrollView}
                  >
                    {selectedMedia.map((media) => (
                      <View key={media.id} style={styles.mediaItem}>
                        {media.type === 'photo' ? (
                          <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                        ) : (
                          <View style={styles.videoThumbnail}>
                            <Icon name="play-circle" size={40} color="#fff" />
                            <Text style={styles.videoText}>Video</Text>
                          </View>
                        )}
                        
                        {/* Media Type Badge */}
                        <View style={styles.mediaBadge}>
                          <Icon 
                            name={media.type === 'photo' ? 'image' : 'videocam'} 
                            size={12} 
                            color="#fff" 
                          />
                        </View>
                        
                        {/* Remove Button */}
                        <TouchableOpacity 
                          style={styles.mediaRemoveButton}
                          onPress={() => removeMedia(media.id)}
                        >
                          <Icon name="close-circle" size={20} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </SectionCard>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={prevStep}
          >
            <Icon name="chevron-back" size={20} color="#f39c12" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />
        
        {currentStep < totalSteps ? (
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Icon name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Property</Text>
                <Icon name="checkmark" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={datePickerOpen}
        date={selectedDate}
        mode="date"
        minimumDate={new Date()}
        maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year from now
        onConfirm={(date) => {
          setDatePickerOpen(false);
          setSelectedDate(date);
          console.log('Selected date:', date.toLocaleDateString('en-IN'));
        }}
        onCancel={() => {
          setDatePickerOpen(false);
        }}
        title="Select Available Date"
        confirmText="Select Date"
        cancelText="Cancel"
        theme="light"
        locale="en"
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModalContainer}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentTitle}>Complete Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={styles.paymentScrollView}
            >
              {/* Simple Pricing */}
              <View style={styles.simplePriceCard}>
                <Icon name="pricetag" size={20} color="#f39c12" />
                <Text style={styles.simplePriceText}>₹100 Per Post</Text>
              </View>

              <Text style={styles.paymentSubtitle}>Select Payment Method</Text>

              <View style={styles.paymentMethodsContainer}>
              {/* UPI */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'upi' && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPaymentMethod('upi')}
              >
                <Icon 
                  name={selectedPaymentMethod === 'upi' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={selectedPaymentMethod === 'upi' ? '#f39c12' : '#999'}
                />
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodTitle}>UPI</Text>
                  <Text style={styles.paymentMethodDesc}>Google Pay, PhonePe, Paytm</Text>
                </View>
                <Icon name="logo-google" size={28} color="#4285F4" />
              </TouchableOpacity>

              {/* Credit/Debit Card */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'card' && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPaymentMethod('card')}
              >
                <Icon 
                  name={selectedPaymentMethod === 'card' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={selectedPaymentMethod === 'card' ? '#f39c12' : '#999'}
                />
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodTitle}>Credit/Debit Card</Text>
                  <Text style={styles.paymentMethodDesc}>Visa, Mastercard, RuPay</Text>
                </View>
                <Icon name="card" size={28} color="#f39c12" />
              </TouchableOpacity>

              {/* Net Banking */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'netbanking' && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPaymentMethod('netbanking')}
              >
                <Icon 
                  name={selectedPaymentMethod === 'netbanking' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={selectedPaymentMethod === 'netbanking' ? '#f39c12' : '#999'}
                />
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodTitle}>Net Banking</Text>
                  <Text style={styles.paymentMethodDesc}>All major banks</Text>
                </View>
                <Icon name="business" size={28} color="#2c3e50" />
              </TouchableOpacity>

              {/* Cash on Delivery */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'cod' && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPaymentMethod('cod')}
              >
                <Icon 
                  name={selectedPaymentMethod === 'cod' ? 'radio-button-on' : 'radio-button-off'} 
                  size={24} 
                  color={selectedPaymentMethod === 'cod' ? '#f39c12' : '#999'}
                />
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodTitle}>Pay Later</Text>
                  <Text style={styles.paymentMethodDesc}>Pay after verification</Text>
                </View>
                <Icon name="cash" size={28} color="#27ae60" />
              </TouchableOpacity>
            </View>

              {/* Payment Button */}
              <TouchableOpacity
                style={[
                  styles.payButton,
                  !selectedPaymentMethod && styles.payButtonDisabled
                ]}
                onPress={handlePropertySubmission}
                disabled={!selectedPaymentMethod || processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.payButtonText}>
                      Pay & Submit Property
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.securePaymentText}>
                <Icon name="lock-closed" size={14} color="#27ae60" /> Secure Payment
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddSellScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  // Progress Indicator Styles
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircleActive: {
    backgroundColor: "#f39c12",
    borderColor: "#f39c12",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  progressTextActive: {
    color: "#fff",
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: "#ddd",
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: "#f39c12",
  },

  content: { padding: 16 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    elevation: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },

  sectionAccent: {
    width: 4,
    height: 18,
    backgroundColor: "#f39c12",
    borderRadius: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  optionPill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  optionPillSelected: {
    backgroundColor: "#f39c12",
    borderColor: "#f39c12",
  },

  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  optionTextSelected: {
    color: "#fff",
  },

  inputWrapper: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },

  textInput: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },

  multilineInput: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },

  checkboxLabel: {
    fontSize: 15,
    color: "#555",
    marginLeft: 12,
  },

  // Contact Options Styles
  contactOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },

  contactPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#f39c12",
    backgroundColor: "#fff",
    gap: 6,
  },

  contactPillSelected: {
    backgroundColor: "#f39c12",
    borderColor: "#f39c12",
  },

  contactPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f39c12",
  },

  contactPillTextSelected: {
    color: "#fff",
  },

  // Contact Toggle Styles
  contactToggleContainer: {
    marginBottom: 14,
  },

  contactToggleTrack: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    padding: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  contactToggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
    gap: 6,
  },

  contactToggleOptionSelected: {
    backgroundColor: "#f39c12",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  contactToggleOptionFirst: {
    marginRight: 1,
  },

  contactToggleOptionLast: {
    marginLeft: 1,
  },

  contactToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  contactToggleTextSelected: {
    color: "#fff",
  },

  // Phone Toggle Switch Styles
  phoneToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  phoneToggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },

  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ddd",
    padding: 2,
    justifyContent: "center",
  },

  toggleSwitchActive: {
    backgroundColor: "#f39c12",
  },

  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },

  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },

  // All Toggles Container Styles
  allTogglesContainer: {
    flexDirection: "row",
    marginTop: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "space-between",
  },

  individualToggleContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  toggleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },

  // Contact Options Grid Styles
  contactOptionsGrid: {
    gap: 16,
  },

  contactOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },

  contactOptionLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  contactOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },

  contactOptionToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ddd",
    padding: 2,
    justifyContent: "center",
  },

  contactOptionToggleActive: {
    backgroundColor: "#f39c12",
  },

  contactOptionThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    transition: "transform 0.2s",
  },

  contactOptionThumbActive: {
    transform: [{ translateX: 22 }],
  },

  // Society Features Styles
  societyFeaturesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#f39c12",
    backgroundColor: "#fff",
    gap: 6,
  },
  featureChipSelected: {
    backgroundColor: "#f39c12",
    borderColor: "#f39c12",
  },
  featureChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f39c12",
  },
  featureChipTextSelected: {
    color: "#fff",
  },

  // Navigation Container Styles
  navigationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f39c12",
    backgroundColor: "#fff",
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f39c12",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#f39c12",
    gap: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#28a745",
    gap: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  // Date Picker Styles
  datePickerContainer: {
    marginBottom: 14,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    marginLeft: 8,
  },
  
  // Toggle Field Styles (for Balconies Yes/No)
  toggleFieldContainer: {
    marginBottom: 14,
  },
  toggleSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ddd",
    padding: 2,
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#f39c12",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  dateHelperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },

  // Media Upload Styles
  mediaUploadButton: {
    borderWidth: 2,
    borderColor: "#f39c12",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#fff8f0",
  },
  mediaUploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f39c12",
    marginTop: 8,
  },
  mediaUploadSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  mediaGrid: {
    marginTop: 8,
  },
  mediaGridTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  mediaScrollView: {
    flexDirection: "row",
  },
  mediaItem: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  videoText: {
    color: "#fff",
    fontSize: 10,
    marginTop: 4,
  },
  mediaBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediaRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
  },

  // Payment Modal Styles
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  paymentModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '75%',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  paymentScrollView: {
    flexGrow: 0,
  },

  // Simple Pricing Card
  simplePriceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f0',
    borderWidth: 2,
    borderColor: '#f39c12',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  simplePriceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f39c12',
  },

  paymentSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 14,
  },
  paymentMethodsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  paymentMethodSelected: {
    backgroundColor: '#fff8f0',
    borderColor: '#f39c12',
    elevation: 2,
    shadowColor: '#f39c12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentMethodContent: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentMethodDesc: {
    fontSize: 13,
    color: '#999',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#f39c12',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: '#f39c12',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  securePaymentText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

// Dropdown styles moved outside main component
const dropdownStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  button: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonOpen: {
    borderColor: "#f39c12",
    backgroundColor: "#fff",
    elevation: 2,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
    paddingVertical: 6,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  modalItemSelected: {
    backgroundColor: "#fff8f0",
  },
  modalItemText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  modalItemTextSelected: {
    color: "#f39c12",
    fontWeight: "600",
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 15,
    color: "#999",
  },
});
