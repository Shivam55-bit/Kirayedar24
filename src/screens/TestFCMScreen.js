import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { getStoredFCMToken, getFCMToken } from '../utils/fcmService';
import AsyncStorage from '@react-native-async-storage/async-storage';
// API services removed
// import { 
//   sendNewPropertyNotification,
//   sendInquiryNotification,
//   sendChatNotification,
//   sendServiceCancelNotification,
//   sendServiceCompleteNotification,
//   sendSystemUpdateNotification,
//   broadcastAppUpdate
// } from '../services/notificationService';

const TestFCMScreen = () => {
  const [fcmToken, setFcmToken] = useState('Loading...');
  const [userId, setUserId] = useState('Not logged in');
  const [loginToken, setLoginToken] = useState('Not logged in');

  useEffect(() => {
    loadFCMInfo();
  }, []);

  const loadFCMInfo = async () => {
    try {
      // Get FCM token
      const token = await getStoredFCMToken();
      if (token) {
        setFcmToken(token);
      } else {
        setFcmToken('No token found');
      }

      // Get user ID
      const uid = await AsyncStorage.getItem('userId');
      if (uid) {
        setUserId(uid);
      }

      // Get login/auth token
      const authToken = await AsyncStorage.getItem('userToken');
      if (authToken) {
        setLoginToken(authToken);
      } else {
        setLoginToken('No login token found');
      }
    } catch (error) {
      console.error('Error loading FCM info:', error);
      setFcmToken('Error: ' + error.message);
    }
  };

  const refreshToken = async () => {
    try {
      const newToken = await getFCMToken();
      if (newToken) {
        setFcmToken(newToken);
        Alert.alert('Success', 'FCM Token refreshed!');
      } else {
        Alert.alert('Error', 'Failed to get FCM token');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const copyToken = () => {
    Alert.alert(
      'FCM Token',
      fcmToken,
      [
        {
          text: 'Copy',
          onPress: () => {
            // In production, use Clipboard API
            console.log('═══════════════════════════════════════');
            console.log('📋 COPY THIS FCM TOKEN:');
            console.log(fcmToken);
            console.log('═══════════════════════════════════════');
            Alert.alert('Copied', 'Token logged to console. Check Metro bundler!');
          },
        },
        { text: 'OK' },
      ]
    );
  };

  const copyLoginToken = () => {
    Alert.alert(
      'Login/Auth Token',
      loginToken,
      [
        {
          text: 'Copy',
          onPress: () => {
            console.log('═══════════════════════════════════════');
            console.log('🔑 COPY THIS LOGIN TOKEN:');
            console.log(loginToken);
            console.log('═══════════════════════════════════════');
            Alert.alert('Copied', 'Login token logged to console!');
          },
        },
        { text: 'OK' },
      ]
    );
  };

  // Test notification functions
  const testNewPropertyNotification = async () => {
    try {
      // Test the notification handler format
      await sendNewPropertyNotification({
        propertyId: '67890',
        title: 'Luxury Villa in Mumbai Test',
        location: 'Bandra West, Mumbai',
        price: '2.5 Crore'
      });
      
      Alert.alert('Info', 'Backend automatically sends notifications when properties are added!\n\nCheck console for details.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const testInquiryNotification = async () => {
    try {
      if (fcmToken === 'Loading...' || fcmToken === 'No token found') {
        Alert.alert('Error', 'FCM Token not available');
        return;
      }
      
      await sendInquiryNotification(fcmToken, {
        inquiryId: '456',
        propertyId: '123',
        inquirerName: 'Test User',
        inquirerPhone: '+91 9876543210',
        message: 'Test inquiry message'
      });
      
      Alert.alert('Success', 'Inquiry notification sent!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const testChatNotification = async () => {
    try {
      if (fcmToken === 'Loading...' || fcmToken === 'No token found') {
        Alert.alert('Error', 'FCM Token not available');
        return;
      }
      
      await sendChatNotification(fcmToken, {
        chatId: '789',
        senderId: 'test123',
        senderName: 'Test Sender',
        message: 'Hello! This is a test chat message.'
      });
      
      Alert.alert('Success', 'Chat notification sent!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const testServiceCancelNotification = async () => {
    try {
      if (fcmToken === 'Loading...' || fcmToken === 'No token found') {
        Alert.alert('Error', 'FCM Token not available');
        return;
      }
      
      await sendServiceCancelNotification(fcmToken, {
        serviceId: '101',
        serviceName: 'Property Inspection Test',
        appointmentDate: '2024-01-15',
        cancelReason: 'Test cancellation'
      });
      
      Alert.alert('Success', 'Service Cancel notification sent!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const testServiceCompleteNotification = async () => {
    try {
      if (fcmToken === 'Loading...' || fcmToken === 'No token found') {
        Alert.alert('Error', 'FCM Token not available');
        return;
      }
      
      await sendServiceCompleteNotification(fcmToken, {
        serviceId: '101',
        serviceName: 'Property Inspection Test',
        completedDate: '2024-01-15',
        rating: '4.5'
      });
      
      Alert.alert('Success', 'Service Complete notification sent!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const testSystemUpdateNotification = async () => {
    try {
      // This API doesn't need FCM token, it sends to all users
      await sendSystemUpdateNotification({
        title: "New App Update Available!",
        message: "A new version of the Real Estate app is now available. Update to enjoy the latest features and improvements."
      });
      
      Alert.alert('Success', 'System Update notification sent to all users!');
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('System update test error:', error);
    }
  };

  const testBroadcastAppUpdate = async () => {
    try {
      // Test the broadcast function with version number
      await broadcastAppUpdate('2.1.0', 'Major update with new property search features and performance improvements!');
      
      Alert.alert('Success', 'App Update broadcast sent to all users!');
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('Broadcast update test error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase Cloud Messaging Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{userId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Login/Auth Token:</Text>
        <ScrollView horizontal style={styles.tokenContainer}>
          <Text style={styles.token} selectable>{loginToken}</Text>
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.button} onPress={copyLoginToken}>
        <Text style={styles.buttonText}>Show Full Login Token</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.label}>FCM Token:</Text>
        <ScrollView horizontal style={styles.tokenContainer}>
          <Text style={styles.token} selectable>{fcmToken}</Text>
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.button} onPress={copyToken}>
        <Text style={styles.buttonText}>Show Full FCM Token</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={refreshToken}>
        <Text style={styles.buttonText}>Refresh FCM Token</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={loadFCMInfo}>
        <Text style={styles.buttonText}>Reload Info</Text>
      </TouchableOpacity>

      {/* Notification Test Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Test Notifications</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testNewPropertyNotification}>
          <Text style={styles.testButtonText}>Test New Property</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testInquiryNotification}>
          <Text style={styles.testButtonText}>Test Inquiry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testChatNotification}>
          <Text style={styles.testButtonText}>Test Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testServiceCancelNotification}>
          <Text style={styles.testButtonText}>Test Service Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testServiceCompleteNotification}>
          <Text style={styles.testButtonText}>Test Service Complete</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testSystemUpdateNotification}>
          <Text style={styles.testButtonText}>Test System Update</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.testButton, {backgroundColor: '#ff6b35'}]} onPress={testBroadcastAppUpdate}>
          <Text style={styles.testButtonText}>🚀 Broadcast App Update</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📋 How to Test:</Text>
        <Text style={styles.instructionsText}>
          • Use test buttons above to send notifications to your device{'\n'}
          • Each button tests different notification type{'\n'}
          • Tap notifications to see auto-navigation{'\n'}
          • Check console for detailed logs{'\n\n'}
          
          <Text style={styles.instructionsTitle}>Manual Testing:</Text>
          1. Copy the FCM token above{'\n'}
          2. Give token to backend developer{'\n'}
          3. Backend can send notifications using APIs{'\n'}
          4. Or use Firebase Console for testing
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  tokenContainer: {
    maxHeight: 100,
  },
  token: {
    fontSize: 12,
    color: '#007bff',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  testButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});

export default TestFCMScreen;
