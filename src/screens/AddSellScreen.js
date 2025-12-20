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
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addProperty } from '../services/api'; // Import the API service

// Move Dropdown component outside to prevent recreation
const Dropdown = React.memo(({ options, selectedValue, onSelect, isOpen, setIsOpen, placeholder, icon = "location", searchText, setSearchText }) => {
  const filteredOptions = useMemo(() => 
    options.filter(option => 
      option.toLowerCase().includes(searchText.toLowerCase())
    ), [options, searchText]
  );

  return (
    <View style={[dropdownStyles.container, isOpen && { zIndex: 1000 }]}>
      <Text style={dropdownStyles.label}>{placeholder.replace('Select ', '')}</Text>
      <TouchableOpacity
        style={[dropdownStyles.button, isOpen && dropdownStyles.buttonOpen]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <View style={dropdownStyles.buttonContent}>
          <Icon name={icon} size={16} color="#f39c12" style={dropdownStyles.icon} />
          <Text style={[dropdownStyles.buttonText, !selectedValue && dropdownStyles.placeholderText]}>
            {selectedValue || placeholder}
          </Text>
        </View>
        <Icon 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={isOpen ? "#f39c12" : "#666"} 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={dropdownStyles.list}>
          <View style={dropdownStyles.searchContainer}>
            <Icon name="search" size={16} color="#999" />
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
          
          <ScrollView 
            style={dropdownStyles.scroll} 
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            bounces={false}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    dropdownStyles.item,
                    selectedValue === option && dropdownStyles.itemSelected
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setIsOpen(false);
                    setSearchText("");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    dropdownStyles.itemText,
                    selectedValue === option && dropdownStyles.itemTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedValue === option && (
                    <Icon name="checkmark-circle" size={20} color="#f39c12" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={dropdownStyles.noResults}>
                <Icon name="search" size={24} color="#ccc" />
                <Text style={dropdownStyles.noResultsText}>No results found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
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
  const [locality, setLocality] = useState("");
  const [pincode, setPincode] = useState("");
  const [propertyType, setPropertyType] = useState("Residential");
  const [commercialType, setCommercialType] = useState("office");
  const [residentialType, setResidentialType] = useState("Apartment");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [balconies, setBalconies] = useState("1");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [facingDirection, setFacingDirection] = useState("North");
  const [contactNumber, setContactNumber] = useState("");
  const [purpose, setPurpose] = useState("Sell");
  const [parking, setParking] = useState("Available");
  const [furnishing, setFurnishing] = useState("Semi-Furnished");
  const [kitchenType, setKitchenType] = useState("Simple");
  const [availability, setAvailability] = useState("Ready to Move");
  const [availableFor, setAvailableFor] = useState("Family");
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [localityDropdownOpen, setLocalityDropdownOpen] = useState(false);
  const [stateSearchText, setStateSearchText] = useState("");
  const [citySearchText, setCitySearchText] = useState("");
  const [localitySearchText, setLocalitySearchText] = useState("");
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
    if (!locality?.trim()) {
      Alert.alert('Missing Information', 'Please select Locality/Area');
      return false;
    }
    if (!pincode?.trim() || !/^\d{6}$/.test(pincode.trim())) {
      Alert.alert('Invalid PIN Code', 'Please enter a valid 6-digit PIN code');
      return false;
    }
    return true;
  }, [propertyState, city, locality, pincode]);

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
      { value: locality, name: "Locality", field: "address.locality" },
      { value: pincode, name: "PIN Code", field: "address.pincode" },
      { value: area, name: "Area", field: "areaDetails" },
      { value: price, name: "Price", field: "price" },
      { value: contactNumber, name: "Contact Number", field: "contactNumber" },
      { value: facingDirection, name: "Facing Direction", field: "facingDirection" },
    ];

    // CRITICAL: Address fields validation - Backend requires nested address object
    const addressValidation = {
      state: propertyState?.trim() || '',
      city: city?.trim() || '',
      locality: locality?.trim() || '',
      pincode: pincode?.trim() || ''
    };

    console.log('🔍 Address validation check:');
    Object.entries(addressValidation).forEach(([key, value]) => {
      console.log(`  - ${key}: "${value}" (length: ${value.length})`);
    });

    // Validate each address field individually
    const addressErrors = [];
    if (!addressValidation.state) addressErrors.push('State');
    if (!addressValidation.city) addressErrors.push('City');
    if (!addressValidation.locality) addressErrors.push('Locality');
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
      
      // CRITICAL: Floor validation for Apartment/Villa (Backend schema requirement)
      if (residentialType === 'Apartment' || residentialType === 'Villa') {
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
    }

    // 5. AVAILABILITY ENUM VALIDATION (Backend schema enum)
    if (!availability || !['Ready to Move', 'Under Construction'].includes(availability)) {
      Alert.alert("Invalid Availability", "Please select availability status: 'Ready to Move' or 'Under Construction'");
      console.log('❌ Validation failed: Invalid availability enum:', availability);
      return;
    }

    console.log('✅ All frontend validation passed successfully!');
    console.log('📋 Validated field values:', {
      address: addressValidation, // Use validated address object
      areaDetails: areaNum,
      price: priceNum,
      propertyType,
      availability,
      contactNumber
    });
    
    // =============================================================================
    // FORMDATA CONSTRUCTION (Exact backend schema match)
    // =============================================================================
    
    setSubmitting(true);
    
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
      formData.append('pincode', addressValidation.pincode);
      
      console.log('📦 FormData Address Fields (Flat - Backend Compatible):');
      console.log(`  ✅ state: "${addressValidation.state}"`);
      console.log(`  ✅ city: "${addressValidation.city}"`);
      console.log(`  ✅ locality: "${addressValidation.locality}"`);
      console.log(`  ✅ pincode: "${addressValidation.pincode}"`);
      
      // Required core fields - Backend schema requirements
      formData.append('areaDetails', areaNum);           // Must be Number (not string)
      formData.append('price', priceNum);                // Must be Number (not string)
      formData.append('contactNumber', contactNumber.trim());
      formData.append('propertyType', propertyType);     // "Residential" or "Commercial"
      formData.append('purpose', purpose);               // "Sell", "Rent/Lease", "Paying Guest"
      formData.append('facingDirection', facingDirection); // Required enum field
      formData.append('furnishingStatus', furnishing);   // Backend expects "furnishingStatus"
      formData.append('parking', parking);               // "Available" or "Not Available"
      
      // CRITICAL: Availability enum - Must match backend exactly
      // Backend schema: enum: ["Ready to Move", "Under Construction"]
      formData.append('availability', availability);
      
      // Required propertyLocation field (backend schema) - Use validated address fields
      const propertyLocationText = `${addressValidation.locality}, ${addressValidation.city}, ${addressValidation.state} - ${addressValidation.pincode}`;
      formData.append('propertyLocation', propertyLocationText);
      
      // Description field (required) - Use validated address fields
      const propertyDescription = `${propertyType} property for ${purpose.toLowerCase()} in ${addressValidation.locality}, ${addressValidation.city}. ${propertyType === 'Residential' ? `${bedrooms} bedrooms, ${bathrooms} bathrooms. ` : ''}${furnishing}. Contact: ${contactNumber}`;
      formData.append('description', propertyDescription);
      
      // Property type specific fields
      if (propertyType === 'Residential') {
        // Residential specific fields (backend schema requirements)
        formData.append('residentialType', residentialType);  // "Apartment", "Villa", "Plot"
        formData.append('bedrooms', parseInt(bedrooms));      // Must be Number
        formData.append('bathrooms', parseInt(bathrooms));    // Must be Number
        formData.append('balconies', parseInt(balconies) || 0); // Must be Number
        
        // CRITICAL: Floor fields - Required for non-Plot residential
        // Backend schema: required when propertyType === "Residential" AND residentialType !== "Plot"
        if (residentialType === 'Apartment' || residentialType === 'Villa') {
          formData.append('floorNumber', parseInt(floorNumber));   // Required Number
          formData.append('totalFloors', parseInt(totalFloors));  // Required Number
        }
        
        console.log('🏠 Added residential fields:', {
          residentialType,
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          balconies: parseInt(balconies) || 0,
          floorNumber: residentialType !== 'Plot' ? parseInt(floorNumber) : 'N/A for Plot',
          totalFloors: residentialType !== 'Plot' ? parseInt(totalFloors) : 'N/A for Plot'
        });
        
      } else if (propertyType === 'Commercial') {
        // Commercial specific fields
        formData.append('commercialType', commercialType); // "office", "shop", "warehouse"
        
        console.log('🏢 Added commercial fields:', { commercialType });
      }
      
      // Media files attachment
      let mediaCount = 0;
      selectedMedia.forEach((media, index) => {
        if (media.uri) {
          const fileExtension = media.type === 'photo' ? 'jpg' : 'mp4';
          const fileName = media.name || `media_${index}.${fileExtension}`;
          
          formData.append('photosAndVideo', {
            uri: media.uri,
            type: media.type === 'photo' ? 'image/jpeg' : 'video/mp4',
            name: fileName
          });
          mediaCount++;
        }
      });
      
      // Final payload verification log
      console.log('🔍 FINAL PAYLOAD VERIFICATION:');
      console.log('═══════════════════════════════════════');
      console.log('✓ Address Structure (Nested Object):');
      console.log(`  - address[state]: "${propertyState.trim()}"`);
      console.log(`  - address[city]: "${city.trim()}"`);
      console.log(`  - address[locality]: "${locality.trim()}"`);
      console.log(`  - address[pincode]: "${pincode.trim()}"`);
      console.log('✓ Required Numbers (Validated):');
      console.log(`  - areaDetails: ${areaNum} (${typeof areaNum})`);
      console.log(`  - price: ${priceNum} (${typeof priceNum})`);
      console.log('✓ Availability Enum (Schema Match):');
      console.log(`  - availability: "${availability}" (Valid: ${['Ready to Move', 'Under Construction'].includes(availability)})`);
      console.log('✓ Property Location:');
      console.log(`  - propertyLocation: "${propertyLocationText}"`);
      console.log('✓ Media Files:');
      console.log(`  - photosAndVideo count: ${mediaCount}`);
      console.log('═══════════════════════════════════════');

      // =============================================================================
      // API CALL (Using centralized service)
      // =============================================================================
      
      console.log('🚀 Submitting to backend API...');
      const result = await addProperty(formData);
      
      if (result.success) {
        console.log('✅ Property submitted successfully!');
        console.log('📄 Property data:', result.property);
        
        Alert.alert(
          "Success", 
          result.message || "Property added successfully!", 
          [
            {
              text: "View My Properties", 
              onPress: () => {
                navigation.navigate('MyPropertyScreen', { refresh: true, timestamp: Date.now() });
              }
            },
            {
              text: "Go Home", 
              onPress: () => {
                navigation.navigate('Home', { refresh: true, timestamp: Date.now() });
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
              options={[
                "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
                "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
                "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
                "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
                "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
                "Uttarakhand", "West Bengal", "Other"
              ]}
              selectedValue={propertyState}
              onSelect={setPropertyState}
              isOpen={stateDropdownOpen}
              setIsOpen={(val) => {
                setStateDropdownOpen(val);
                if (val) {
                  setCityDropdownOpen(false);
                  setLocalityDropdownOpen(false);
                }
              }}
              placeholder="Select State"
              icon="map"
              searchText={stateSearchText}
              setSearchText={setStateSearchText}
            />
            <Dropdown
              options={[
                "Ahmedabad", "Bangalore", "Bhopal", "Chandigarh", "Chennai", "Coimbatore",
                "Delhi", "Faridabad", "Ghaziabad", "Gurgaon", "Hyderabad", "Indore",
                "Jaipur", "Kanpur", "Kochi", "Kolkata", "Lucknow", "Ludhiana",
                "Mumbai", "Nagpur", "Nashik", "Noida", "Patna", "Pune", "Rajkot",
                "Surat", "Thane", "Thiruvananthapuram", "Vadodara", "Varanasi", "Vijayawada",
                "Visakhapatnam", "Other"
              ]}
              selectedValue={city}
              onSelect={setCity}
              isOpen={cityDropdownOpen}
              setIsOpen={(val) => {
                setCityDropdownOpen(val);
                if (val) {
                  setStateDropdownOpen(false);
                  setLocalityDropdownOpen(false);
                }
              }}
              placeholder="Select City"
              icon="business"
              searchText={citySearchText}
              setSearchText={setCitySearchText}
            />
            <Dropdown
              options={[
                "Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6", "Sector 7", "Sector 8", "Sector 9", "Sector 10",
                "Model Town", "Civil Lines", "Sadar Bazaar", "Gandhi Nagar", "Lajpat Nagar", "Kamla Nagar", "Mall Road", "Industrial Area",
                "Railway Road", "GT Road", "Shaheed Bhagat Singh Nagar", "Urban Estate", "Phase 1", "Phase 2", "Phase 3", "Phase 4",
                "New Colony", "Old City", "Market Area", "Residential Area", "Commercial Area", "IT Park", "Business District",
                "Green Park", "Rose Garden", "City Center", "Downtown", "Uptown", "Suburb Area", "Metro Station Area", "Other"
              ]}
              selectedValue={locality}
              onSelect={setLocality}
              isOpen={localityDropdownOpen}
              setIsOpen={(val) => {
                setLocalityDropdownOpen(val);
                if (val) {
                  setStateDropdownOpen(false);
                  setCityDropdownOpen(false);
                }
              }}
              placeholder="Select Locality/Area"
              icon="location-outline"
              searchText={localitySearchText}
              setSearchText={setLocalitySearchText}
            />
            <InputField
              label="PIN Code*"
              placeholder="Enter 6-digit PIN code"
              keyboardType="numeric"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
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
                </>
              )}

              {propertyType === "Residential" && (
                <>
                  <Text style={styles.fieldLabel}>Residential Type</Text>
                  <OptionSelector
                    options={["Apartment", "Villa", "Plot"]}
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

                  <Text style={styles.fieldLabel}>Balconies</Text>
                  <OptionSelector
                    options={["0", "1", "2", "3", "4+"]}
                    selectedValue={balconies}
                    onSelect={setBalconies}
                  />

                  {residentialType !== "Plot" && (
                    <>
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

              <Text style={styles.fieldLabel}>Facing Direction</Text>
              <OptionSelector
                options={["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"]}
                selectedValue={facingDirection}
                onSelect={setFacingDirection}
              />

              <Text style={styles.fieldLabel}>Furnishing Status</Text>
              <OptionSelector
                options={["Fully-Furnished", "Semi-Furnished", "Unfurnished"]}
                selectedValue={furnishing}
                onSelect={setFurnishing}
              />

              <Text style={styles.fieldLabel}>Parking</Text>
              <OptionSelector
                options={["Available", "Not Available"]}
                selectedValue={parking}
                onSelect={setParking}
              />
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

              <Text style={styles.fieldLabel}>Available For</Text>
              <OptionSelector
                options={["Family", "Students", "Bachelor", "Any"]}
                selectedValue={availableFor}
                onSelect={setAvailableFor}
              />
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
});

// Dropdown styles moved outside main component
const dropdownStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
    position: "relative",
    zIndex: 1,
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
  list: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f39c12",
    borderRadius: 12,
    maxHeight: 250,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
    overflow: "hidden",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    paddingVertical: 4,
  },
  scroll: {
    maxHeight: 180,
    flexGrow: 0,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "#fff",
  },
  itemSelected: {
    backgroundColor: "#fff8f0",
  },
  itemText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  itemTextSelected: {
    color: "#f39c12",
    fontWeight: "600",
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noResultsText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
});
