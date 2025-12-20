# User Profile API Documentation

## Overview
The user profile API provides endpoints for managing user profile data including viewing and editing user information.

## Base URL
```
https://n5.bhoomitechzone.us
```

## Authentication
All user profile endpoints require authentication via Bearer token in the Authorization header.

## Endpoints

### 1. Get User Profile
**GET** `/auth/users/{userId}`

Retrieves profile information for a specific user.

#### Request
```bash
curl --location 'https://n5.bhoomitechzone.us/auth/users/6933fc1eae4efafe932fd5e2' \
--header 'Authorization: Bearer {token}'
```

#### Response
```json
{
  "success": true,
  "user": {
    "_id": "6933fc1eae4efafe932fd5e2",
    "fullName": "John Doe",
    "email": "john@example.com", 
    "phone": "9876543210",
    "state": "Delhi",
    "city": "New Delhi",
    "street": "MG Road",
    "pinCode": "110001",
    "profilePicture": null,
    "createdAt": "2024-12-06T00:00:00.000Z",
    "updatedAt": "2024-12-06T00:00:00.000Z"
  }
}
```

### 2. Edit User Profile
**PUT** `/auth/edit-profile/{userId}`

Updates profile information for a specific user.

#### Request
```bash
curl --location --request PUT 'https://n5.bhoomitechzone.us/auth/edit-profile/6933fc1eae4efafe932fd5e2' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {token}' \
--data-raw '{
    "fullName": "John Updated",
    "email": "john.updated@example.com",
    "phone": "9876543210", 
    "state": "Delhi",
    "city": "New Delhi",
    "street": "Updated MG Road",
    "pinCode": "110001",
    "password": "NewPassword123"
}'
```

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fullName | string | Yes | User's full name (min 2 characters) |
| email | string | Yes | Valid email address |
| phone | string | Yes | 10-digit phone number |
| state | string | Yes | User's state |
| city | string | Yes | User's city |
| street | string | No | Street address |
| pinCode | string | Yes | 6-digit PIN code |
| password | string | No | New password (min 6 characters) |

#### Response
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "6933fc1eae4efafe932fd5e2",
    "fullName": "John Updated", 
    "email": "john.updated@example.com",
    "phone": "9876543210",
    "state": "Delhi",
    "city": "New Delhi", 
    "street": "Updated MG Road",
    "pinCode": "110001",
    "profilePicture": null,
    "updatedAt": "2024-12-06T10:30:00.000Z"
  }
}
```

## Integration in React Native

### userApi.js Functions

#### Import
```javascript
import { 
  getCurrentUserProfile, 
  updateCurrentUserProfile, 
  getUserProfile, 
  editUserProfile, 
  validateProfileData 
} from '../services/userApi';
```

#### Get Current User Profile
```javascript
const loadProfile = async () => {
  const response = await getCurrentUserProfile();
  if (response.success) {
    setUserData(response.user);
  } else {
    console.error('Failed to load profile:', response.message);
  }
};
```

#### Update Current User Profile
```javascript
const updateProfile = async (profileData) => {
  // Validate first
  const validation = validateProfileData(profileData);
  if (!validation.isValid) {
    Alert.alert('Validation Error', validation.errors.join('\n'));
    return;
  }

  const response = await updateCurrentUserProfile(profileData);
  if (response.success) {
    Alert.alert('Success', 'Profile updated successfully');
    setUserData(response.user);
  } else {
    Alert.alert('Error', response.message);
  }
};
```

#### Validation
```javascript
const profileData = {
  fullName: "John Doe",
  email: "john@example.com", 
  phone: "9876543210",
  state: "Delhi",
  city: "New Delhi",
  pinCode: "110001"
};

const validation = validateProfileData(profileData);
if (validation.isValid) {
  // Proceed with API call
} else {
  // Show validation errors
  console.log('Errors:', validation.errors);
}
```

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "Invalid or missing token"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Valid email is required",
    "Phone number must be 10 digits"
  ]
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

#### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Files Modified

### New Files Created
- `src/services/userApi.js` - User profile API functions
- `src/debug/userApiTest.js` - API testing utilities

### Files Updated  
- `src/screens/ProfileScreen.js` - Updated to use real API data
- `src/screens/EditProfileScreen.js` - Updated form fields and API integration

## Testing

Use the test functions in `src/debug/userApiTest.js` to verify API integration:

```javascript
import { testGetCurrentProfile, testUpdateProfile } from '../debug/userApiTest';

// Test profile loading
await testGetCurrentProfile();

// Test profile updating
await testUpdateProfile();

// Test validation
testProfileValidation();
```