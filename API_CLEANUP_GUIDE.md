# 🔧 API Integration Cleanup - Setup Guide

## ✅ Cleanup Complete!

Sabhi purani API integrations ko successfully remove kar diya gaya hai aur ek centralized configuration system set up kar diya gaya hai.

---

## 📋 Changes Summary

### 1. **New Configuration File Created**
- **File**: `src/config/api.config.js`
- Yeh file sabhi API URLs ko centrally manage karti hai
- Sirf ek jagah BASE_URL change karke pure app mein update ho jayega

### 2. **Files Updated** (Total: 11 files)

#### **Core Services**
- ✅ `src/services/api.js` - Main API service updated

#### **Utility Files**
- ✅ `src/utils/fcmService.js` - Firebase Cloud Messaging
- ✅ `src/utils/fcmTestService.js` - FCM testing utilities
- ✅ `src/utils/fcmDebugHelper.js` - FCM debugging
- ✅ `src/utils/notificationTest.js` - Notification testing
- ✅ `src/utils/chatDiagnostics.js` - Chat diagnostics

#### **Screen Files**
- ✅ `src/screens/ChatDetailScreen.js` - Chat screen
- ✅ `src/screens/AddSellScreen.js` - Add property screen

#### **Hook Files**
- ✅ `src/hooks/useChatSocket.js` - Socket connection hook

#### **Test Scripts**
- ✅ `test_apis.ps1` - PowerShell test script
- ✅ `test_apis_fixed.ps1` - Fixed test script

---

## 🚀 How to Setup Your New Backend

### Step 1: Update Configuration File

Open `src/config/api.config.js` and update these values:

```javascript
// Line 8-9: Update BASE_URL
export const BASE_URL = 'https://your-new-backend.com/api';

// Line 14: Update SOCKET_URL  
export const SOCKET_URL = 'https://your-new-backend.com';
```

### Step 2: Verify Changes

```bash
# Search karke dekhein ki koi hardcoded URL to nahi reh gaya
grep -r "n5.bhoomitechzone.us" src/
grep -r "abc.ridealmobility.com" src/

# Empty result = Perfect! ✅
```

### Step 3: Test the App

```bash
# Install dependencies (if needed)
npm install

# Start Metro bundler
npx react-native start

# Run on Android
npx react-native run-android

# Run on iOS  
npx react-native run-ios
```

---

## 📂 Configuration File Structure

### **`src/config/api.config.js`** contains:

1. **BASE_URL** - Main API endpoint
2. **SOCKET_URL** - WebSocket server URL
3. **API_TIMEOUT** - Request timeout (15 seconds)
4. **ENDPOINTS** - All API endpoint paths organized by category:
   - 🔐 Auth (signup, login, OTP)
   - 👤 User (profile, FCM token)
   - 🏠 Properties (CRUD operations)
   - 💬 Chat (messaging)
   - 🔔 Notifications

---

## ⚡ Benefits of This Setup

### ✨ **Centralized Management**
- Ek file edit karo, pure app mein update ho jaye
- No more hunting for hardcoded URLs in multiple files

### 🛡️ **Better Error Handling**
- If BASE_URL empty hai, to clear warning/error milega
- Users ko pata chalega ki configuration missing hai

### 🔧 **Easy Environment Switching**
```javascript
// Development
export const BASE_URL = 'http://localhost:3000/api';

// Staging
export const BASE_URL = 'https://staging.yourdomain.com/api';

// Production
export const BASE_URL = 'https://api.yourdomain.com/api';
```

### 📦 **Type Safety & Documentation**
- ENDPOINTS object se clear pata chalta hai ki kaunse endpoints available hain
- Auto-completion support in modern editors

---

## 🔍 Removed Integrations

### Old URLs Removed:
- ❌ `https://n5.bhoomitechzone.us/api/*` (9 instances)
- ❌ `https://abc.ridealmobility.com` (1 instance)
- ❌ All hardcoded URLs from 11+ files

### New Approach:
- ✅ Dynamic imports from `api.config.js`
- ✅ Runtime checks for configuration
- ✅ Helpful error messages

---

## 🧪 Testing Your Setup

### Test Individual Components:

```javascript
// Test if config is loaded
import { BASE_URL, SOCKET_URL } from './src/config/api.config';
console.log('BASE_URL:', BASE_URL);
console.log('SOCKET_URL:', SOCKET_URL);
```

### Test API Calls:
```javascript
import { login } from './src/services/api';

// Try login (will show config error if BASE_URL empty)
login('test@example.com', 'password123')
  .then(response => console.log('Response:', response))
  .catch(error => console.error('Error:', error));
```

---

## 📞 Support

Agar koi issue aaye to:

1. **Check Configuration**: `src/config/api.config.js` mein BASE_URL set hai ya nahi
2. **Check Console**: App console mein helpful warnings/errors dekhein
3. **Verify Network**: Backend server running hai ya nahi check karein
4. **Test Endpoints**: Postman se manually endpoints test karein

---

## 📝 Notes

- **Backward Compatibility**: Existing code structure maintained
- **No Breaking Changes**: API functions ka signature same hai
- **Progressive Enhancement**: Ek-ek feature test kar sakte ho
- **Clean Slate**: Fresh backend integration ke liye ready

---

## 🎯 Next Steps

1. ✅ Setup your new backend server
2. ✅ Update `src/config/api.config.js` with new URLs
3. ✅ Test authentication flows
4. ✅ Test property listing/details
5. ✅ Test chat functionality
6. ✅ Test notifications (FCM)
7. ✅ Production deployment

---

**Created on**: December 6, 2025
**Status**: ✅ Ready for New Backend Integration
**Maintenance**: Update only `src/config/api.config.js` for API changes
