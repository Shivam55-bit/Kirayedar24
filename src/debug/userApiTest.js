/**
 * User API Test Guide
 * 
 * This file demonstrates how to use the new userApi.js functions
 * for profile management in the Kirayedar24 app.
 */

import { 
  getCurrentUserProfile, 
  updateCurrentUserProfile, 
  getUserProfile, 
  editUserProfile, 
  validateProfileData 
} from '../services/userapi';

// Example 1: Get current user profile
export const testGetCurrentProfile = async () => {
  console.log('🔍 Testing getCurrentUserProfile...');
  
  try {
    const response = await getCurrentUserProfile();
    
    if (response.success) {
      console.log('✅ Profile loaded successfully:', response.user);
      return response.user;
    } else {
      console.log('❌ Failed to load profile:', response.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing profile load:', error);
    return null;
  }
};

// Example 2: Update current user profile
export const testUpdateProfile = async () => {
  console.log('📝 Testing updateCurrentUserProfile...');
  
  const sampleProfileData = {
    fullName: "John Doe Updated",
    email: "john.updated@example.com", 
    phone: "9876543210",
    state: "Delhi",
    city: "New Delhi", 
    street: "Updated MG Road",
    pinCode: "110001"
    // password: "NewPassword123" // Optional
  };

  // Validate first
  const validation = validateProfileData(sampleProfileData);
  if (!validation.isValid) {
    console.log('❌ Validation failed:', validation.errors);
    return null;
  }

  try {
    const response = await updateCurrentUserProfile(sampleProfileData);
    
    if (response.success) {
      console.log('✅ Profile updated successfully:', response.user);
      return response.user;
    } else {
      console.log('❌ Failed to update profile:', response.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing profile update:', error);
    return null;
  }
};

// Example 3: Get profile by specific user ID
export const testGetProfileById = async (userId) => {
  console.log('🔍 Testing getUserProfile with ID:', userId);
  
  try {
    const response = await getUserProfile(userId);
    
    if (response.success) {
      console.log('✅ Profile loaded successfully:', response.user);
      return response.user;
    } else {
      console.log('❌ Failed to load profile:', response.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing profile load by ID:', error);
    return null;
  }
};

// Example 4: Validate profile data
export const testProfileValidation = () => {
  console.log('✅ Testing profile validation...');
  
  // Test valid data
  const validData = {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "9876543210", 
    state: "Delhi",
    city: "New Delhi",
    pinCode: "110001"
  };

  const validResult = validateProfileData(validData);
  console.log('Valid data test:', validResult);

  // Test invalid data
  const invalidData = {
    fullName: "J", // Too short
    email: "invalid-email", // Invalid format
    phone: "123", // Too short
    state: "",
    city: "N", 
    pinCode: "12345" // Wrong length
  };

  const invalidResult = validateProfileData(invalidData);
  console.log('Invalid data test:', invalidResult);
};

// Example usage in a React component:
/*
import { testGetCurrentProfile, testUpdateProfile } from '../debug/userApiTest';

const MyComponent = () => {
  const loadProfile = async () => {
    const profile = await testGetCurrentProfile();
    if (profile) {
      // Use profile data
      setUserData(profile);
    }
  };

  const updateProfile = async () => {
    const updatedProfile = await testUpdateProfile();
    if (updatedProfile) {
      // Profile updated successfully
      setUserData(updatedProfile);
    }
  };

  return (
    // Your component JSX
  );
};
*/

export default {
  testGetCurrentProfile,
  testUpdateProfile, 
  testGetProfileById,
  testProfileValidation
};