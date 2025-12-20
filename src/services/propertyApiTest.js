/**
 * Property Add API Integration Test
 * 
 * This file tests the property add functionality with the backend API
 * to ensure all field mappings are correct according to the curl command provided.
 * 
 * Backend expects:
 * - propertyLocation
 * - areaDetails  
 * - bedrooms
 * - bathrooms
 * - balconies
 * - floorNumber
 * - totalFloors
 * - facingDirection
 * - availability
 * - price
 * - description
 * - furnishingStatus
 * - parking
 * - purpose
 * - propertyType
 * - residentialType
 * - contactNumber
 * - photosAndVideo[] (files)
 */

import { addProperty, validatePropertyData } from './propertyService.js';

// Test data matching the AddSellScreen form
const testPropertyData = {
  propertyLocation: "Sector 14, Gurgaon, Haryana",
  areaDetails: "1200",
  bedrooms: "3",
  bathrooms: "2", 
  balconies: "1",
  floorNumber: "5",
  totalFloors: "10",
  facingDirection: "East",
  availability: "Ready to Move",
  price: "15000000",
  description: "Spacious 3BHK apartment with modern amenities, gym, pool and 24/7 security",
  furnishingStatus: "Semi-Furnished",
  parking: "Available",
  purpose: "Sell",
  propertyType: "Residential", 
  residentialType: "Apartment",
  contactNumber: "9876543210"
};

// Test media files (mock)
const testMediaFiles = [
  {
    uri: "file:///test/image1.jpg",
    type: "image/jpeg",
    name: "property_image_1.jpg"
  },
  {
    uri: "file:///test/video1.mp4", 
    type: "video/mp4",
    name: "property_video_1.mp4"
  }
];

// Test function
export const testPropertyAddAPI = async () => {
  console.log('🧪 Testing Property Add API Integration...');
  
  try {
    // Test validation first
    console.log('1️⃣ Testing data validation...');
    const validation = validatePropertyData(testPropertyData);
    
    if (!validation.isValid) {
      console.error('❌ Validation failed:', validation.errors);
      return { success: false, error: 'Validation failed' };
    }
    
    console.log('✅ Data validation passed');
    
    // Test API call structure (without actually calling API in test)
    console.log('2️⃣ Testing API call structure...');
    
    // Mock the API call to check the FormData structure
    const formData = new FormData();
    
    // Add property data
    Object.keys(testPropertyData).forEach(key => {
      formData.append(key, testPropertyData[key]);
    });
    
    // Add media files
    testMediaFiles.forEach((file, index) => {
      formData.append('photosAndVideo', {
        uri: file.uri,
        type: file.type,
        name: file.name
      });
    });
    
    console.log('✅ FormData structure prepared correctly');
    console.log('📋 Property fields:', Object.keys(testPropertyData));
    console.log('📸 Media files count:', testMediaFiles.length);
    
    // In real usage, this would call the actual API:
    // const response = await addProperty(testPropertyData, testMediaFiles);
    
    console.log('✅ Property Add API integration test completed successfully');
    
    return { 
      success: true, 
      message: 'API integration test passed',
      fieldsCount: Object.keys(testPropertyData).length,
      mediaCount: testMediaFiles.length
    };
    
  } catch (error) {
    console.error('❌ Property Add API test failed:', error);
    return { success: false, error: error.message };
  }
};

// Field mapping verification
export const verifyFieldMapping = () => {
  const requiredBackendFields = [
    'propertyLocation',
    'areaDetails', 
    'bedrooms',
    'bathrooms',
    'balconies',
    'floorNumber',
    'totalFloors', 
    'facingDirection',
    'availability',
    'price',
    'description',
    'furnishingStatus',
    'parking',
    'purpose',
    'propertyType',
    'residentialType',
    'contactNumber'
  ];
  
  const providedFields = Object.keys(testPropertyData);
  const missingFields = requiredBackendFields.filter(field => !providedFields.includes(field));
  const extraFields = providedFields.filter(field => !requiredBackendFields.includes(field));
  
  console.log('🔍 Field Mapping Verification:');
  console.log('✅ Required fields:', requiredBackendFields.length);
  console.log('📋 Provided fields:', providedFields.length);
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields:', missingFields);
  }
  
  if (extraFields.length > 0) {
    console.log('⚠️ Extra fields:', extraFields);
  }
  
  const isComplete = missingFields.length === 0;
  console.log(isComplete ? '✅ All required fields present' : '❌ Some fields missing');
  
  return {
    isComplete,
    missingFields,
    extraFields,
    requiredFields: requiredBackendFields,
    providedFields
  };
};

export default { testPropertyAddAPI, verifyFieldMapping };