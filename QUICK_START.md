# 🎯 API Integration Cleanup - Quick Reference

## ⚡ TL;DR - Quick Start

**Single file ko edit karo, sab kuch setup ho jayega!**

### Edit This File:
```
src/config/api.config.js
```

### Change These Lines:
```javascript
// Line 8
export const BASE_URL = 'https://your-backend.com/api';

// Line 14  
export const SOCKET_URL = 'https://your-backend.com';
```

**That's it! 🎉**

---

## 📊 What Was Cleaned

| Category | Files Updated | Old URLs Removed |
|----------|--------------|------------------|
| **Services** | 1 file | abc.ridealmobility.com |
| **Utilities** | 5 files | n5.bhoomitechzone.us (6x) |
| **Screens** | 2 files | n5.bhoomitechzone.us (3x) |
| **Hooks** | 1 file | n5.bhoomitechzone.us (1x) |
| **Test Scripts** | 2 files | n5.bhoomitechzone.us (2x) |
| **TOTAL** | **11 files** | **13 instances** |

---

## 🎨 File Structure

```
src/
├── config/
│   └── api.config.js           ⭐ EDIT THIS FILE ONLY
├── services/
│   ├── api.js                  ✅ Uses config
│   ├── authApi.js              ✅ Uses api.js
│   └── propertyApi.js          ✅ Uses api.js  
├── utils/
│   ├── fcmService.js           ✅ Uses config
│   ├── fcmTestService.js       ✅ Uses config
│   ├── fcmDebugHelper.js       ✅ Uses config
│   ├── notificationTest.js     ✅ Uses config
│   └── chatDiagnostics.js      ✅ Uses config
├── screens/
│   ├── ChatDetailScreen.js     ✅ Uses config
│   └── AddSellScreen.js        ✅ Uses config
└── hooks/
    └── useChatSocket.js        ✅ Uses config
```

---

## 🚦 Configuration States

### ❌ Empty State (Current)
```javascript
export const BASE_URL = '';  // Empty - Not configured
export const SOCKET_URL = '';
```
**Result**: App shows clear warnings about missing configuration

### ⚙️ Development Setup
```javascript
export const BASE_URL = 'http://localhost:3000/api';
export const SOCKET_URL = 'http://localhost:3000';
```

### 🌐 Production Setup  
```javascript
export const BASE_URL = 'https://api.yourdomain.com/api';
export const SOCKET_URL = 'https://api.yourdomain.com';
```

---

## 🔍 Verification Commands

### Check for Remaining Hardcoded URLs:
```bash
# Should return nothing (all cleaned!)
grep -r "n5.bhoomitechzone.us" src/
grep -r "abc.ridealmobility.com" src/
```

### Test Configuration:
```bash
# Open Node console
node

# Import and check
const config = require('./src/config/api.config.js');
console.log(config.BASE_URL);
console.log(config.SOCKET_URL);
```

---

## 💡 Common Scenarios

### Scenario 1: Local Backend Testing
```javascript
// api.config.js
export const BASE_URL = 'http://192.168.1.100:3000/api';  // Your PC IP
export const SOCKET_URL = 'http://192.168.1.100:3000';
```

### Scenario 2: Multiple Environments
```javascript
// api.config.js
const isDevelopment = __DEV__;

export const BASE_URL = isDevelopment 
  ? 'http://localhost:3000/api'
  : 'https://api.production.com/api';

export const SOCKET_URL = isDevelopment
  ? 'http://localhost:3000' 
  : 'https://api.production.com';
```

### Scenario 3: Environment Variables
```javascript
// api.config.js  
import Config from 'react-native-config';

export const BASE_URL = Config.API_URL || '';
export const SOCKET_URL = Config.SOCKET_URL || '';
```

---

## 🛠️ Troubleshooting

### Problem: App showing "BASE_URL not configured" warning
**Solution**: Update `src/config/api.config.js` with your backend URL

### Problem: API calls failing
**Solution**: 
1. Check if backend server is running
2. Verify URL in config file
3. Check console for detailed error messages

### Problem: Socket connection not working
**Solution**:
1. Ensure SOCKET_URL is set in config
2. Check if WebSocket server is running
3. Verify network/firewall settings

---

## 📱 Testing Checklist

- [ ] Config file updated with BASE_URL
- [ ] Config file updated with SOCKET_URL
- [ ] App builds without errors
- [ ] Login/Signup working
- [ ] Property listing loads
- [ ] Chat messages send/receive
- [ ] Notifications working
- [ ] No console warnings about missing config

---

## 🎁 Benefits

### Before (Old System):
- ❌ URLs scattered across 11+ files
- ❌ Hard to find and update
- ❌ Easy to miss some instances
- ❌ Different URLs in different files
- ❌ No validation or warnings

### After (New System):
- ✅ Single source of truth
- ✅ Easy to update (1 file only)
- ✅ Clear error messages
- ✅ Consistent across entire app
- ✅ Runtime validation

---

## 📞 Quick Help

**If BASE_URL is empty**, app will show:
```
❌ BASE_URL is not configured. Please update src/config/api.config.js
```

**If SOCKET_URL is empty**, app will show:
```
⚠️ SOCKET_URL is not configured in api.config.js
```

These warnings help you quickly identify and fix configuration issues!

---

## ✅ Final Checklist

- [x] ✅ Created centralized config file
- [x] ✅ Removed all hardcoded URLs (13 instances)
- [x] ✅ Updated 11 files with config imports
- [x] ✅ Added helpful error messages
- [x] ✅ Updated test scripts
- [x] ✅ No compilation errors
- [x] ✅ Backward compatible
- [x] ✅ Ready for new backend

---

**Last Updated**: December 6, 2025
**Status**: ✅ COMPLETE - Ready for Production
**Next Step**: Update `src/config/api.config.js` with your backend URLs
