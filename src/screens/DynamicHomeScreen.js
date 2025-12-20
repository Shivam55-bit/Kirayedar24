import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './HomeScreen';
import HomeScreenOwner from './HomeScreenOwner';

const DynamicHomeScreen = ({ navigation }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRole();
    
    // Listen for navigation focus to refresh role data
    const unsubscribe = navigation.addListener('focus', () => {
      getUserRole();
    });

    return unsubscribe;
  }, [navigation]);

  const getUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const storedRole = await AsyncStorage.getItem('userRole');
      
      let role = null;
      if (userData) {
        const user = JSON.parse(userData);
        role = user.role || user.userType;
      }
      
      // Use stored role if available (more recent)
      if (storedRole) {
        role = storedRole;
      }
      
      setUserRole(role);
    } catch (error) {
      console.error('Error getting user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#FDB022" />
      </View>
    );
  }

  // Render appropriate home screen based on user role
  if (userRole === 'Owner' || userRole === 'owner') {
    return <HomeScreenOwner navigation={navigation} />;
  } else {
    return <HomeScreen navigation={navigation} />;
  }
};

export default DynamicHomeScreen;