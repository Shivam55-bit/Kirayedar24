/**
 * Debug Property API Issues
 * 
 * This utility helps debug why properties are not loading in the home screens
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api.config';

export const debugPropertyAPIs = async () => {
  console.log('🔍 Debugging Property API Issues...');
  
  // Check BASE_URL configuration
  console.log('1️⃣ BASE_URL check:', BASE_URL);
  
  // Check auth token
  try {
    const token = await AsyncStorage.getItem('authToken');
    console.log('2️⃣ Auth token check:', token ? `Found (${token.length} chars)` : 'Not found');
    
    if (token) {
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    }
  } catch (error) {
    console.error('❌ Error checking auth token:', error);
  }
  
  // Test public API (no auth required)
  try {
    console.log('3️⃣ Testing public API (no auth)...');
    const publicResponse = await fetch(`${BASE_URL}/property/properties`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Public API status:', publicResponse.status);
    
    if (publicResponse.ok) {
      const data = await publicResponse.json();
      console.log('✅ Public API success:', {
        success: data.success,
        count: data.count || data.length,
        hasData: !!(data.data || data.properties),
        dataLength: (data.data || data.properties || []).length
      });
    } else {
      console.log('❌ Public API failed:', await publicResponse.text());
    }
  } catch (error) {
    console.error('❌ Public API error:', error);
  }
  
  // Test authenticated API
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      console.log('4️⃣ Testing authenticated API...');
      
      const authResponse = await fetch(`${BASE_URL}/property/properties?propertyType=Residential`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📊 Auth API status:', authResponse.status);
      
      if (authResponse.ok) {
        const data = await authResponse.json();
        console.log('✅ Auth API success:', {
          success: data.success,
          count: data.count || data.length,
          hasData: !!(data.data || data.properties),
          dataLength: (data.data || data.properties || []).length
        });
      } else {
        console.log('❌ Auth API failed:', await authResponse.text());
      }
    } else {
      console.log('⚠️ Skipping auth API test - no token');
    }
  } catch (error) {
    console.error('❌ Auth API error:', error);
  }
  
  console.log('🔍 Property API debug complete');
};

export const showStorageInfo = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('💾 AsyncStorage keys:', keys);
    
    const authToken = await AsyncStorage.getItem('authToken');
    const userData = await AsyncStorage.getItem('userData');
    
    console.log('🔑 Auth data:', {
      hasAuthToken: !!authToken,
      hasUserData: !!userData,
      tokenLength: authToken?.length,
    });
    
  } catch (error) {
    console.error('❌ Storage check error:', error);
  }
};

export default { debugPropertyAPIs, showStorageInfo };