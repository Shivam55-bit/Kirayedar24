# Admin Notification - Debugging & Fix Guide

## 🎯 Problem Summary
- ✅ Backend is sending notifications to FCM
- ✅ Firebase Admin SDK is working  
- ❌ **BUT notifications are NOT showing on device**
- ❌ Not in background mode, not in head-up notifications

## 🔍 Root Causes (Check in this order)

### **Cause 1: FCM Tokens Mismatch** (MOST COMMON)
The tokens stored in backend database DON'T match the actual device token.

**Check:**
```bash
# 1. Get all tokens stored in backend DB
curl -X GET "https://n5.bhoomitechzone.us/api/notification/debug/tokens" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Get the actual device token from app console
await checkStoredToken()
# Copy the FCM Token shown
```

**Fix:** Compare tokens - if they don't match, the user needs to login again to refresh token.

---

### **Cause 2: Notification Payload Format** (SECOND MOST COMMON)
Backend might be sending payload that Android doesn't recognize.

**The FIXED payload should have:**
```javascript
{
  tokens: [...],
  notification: {        // ← This is critical
    title: "...",
    body: "...",
    sound: "default"     // ← Some devices need this
  },
  data: {                // ← Extra data
    notificationId: "...",
    from: "admin"
  },
  android: {             // ← Android-specific!
    priority: "high",    // ← CRITICAL for foreground
    notification: {
      sound: "default",
      priority: "high",
      visibility: "public",
      channelId: "default_notification_channel"
    }
  },
  apns: { ... }          // ← For iOS
}
```

---

### **Cause 3: Firebase Project Mismatch**
Frontend app might be using different Firebase project than backend.

**Check:**
- Frontend: `google-services.json` in `android/app/`
- Backend: Check your `firebase.json` and service account
- Both must have same `projectId`

---

## 🛠️ **FIXES TO APPLY**

### **Backend Controller Fix**
Replace your notification controller with the FIXED version in:
`ADMIN_NOTIFICATION_BACKEND_FIX.js`

**Key improvements:**
1. ✅ Proper Android notification priority (HIGH)
2. ✅ Channel ID matching frontend
3. ✅ Better token validation
4. ✅ Detailed logging to find issues
5. ✅ New test endpoints for debugging

---

## 🧪 **Testing Steps**

### **Step 1: Verify tokens in database**
```bash
curl -X GET "https://n5.bhoomitechzone.us/api/notification/debug/tokens" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "totalUsers": 2,
  "totalTokens": 5,
  "data": [
    {
      "userId": "...",
      "email": "user@example.com",
      "tokenCount": 2,
      "tokens": ["abc123...", "def456..."]
    }
  ]
}
```

**What to check:**
- ✓ `totalTokens` should be > 0
- ✓ Each user should have at least 1 token
- ✓ Tokens should be long strings (60+ chars)

---

### **Step 2: Get device's actual FCM token**
In your React Native app console, run:
```javascript
await checkStoredToken()
```

This shows your device's actual FCM token.

---

### **Step 3: Send test notification with actual device token**
```bash
curl -X POST "https://n5.bhoomitechzone.us/api/notification/test-send" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "PASTE_YOUR_DEVICE_TOKEN_HERE",
    "title": "Test Notification",
    "message": "If you see this, FCM is working!"
  }'
```

**Expected:**
- If you see notification on device → FCM is working ✅
- If you don't → Token is invalid ❌

---

### **Step 4: Send admin notification**
```bash
curl -X POST "https://n5.bhoomitechzone.us/api/notification/create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Admin Test",
    "message": "Testing admin notifications"
  }'
```

**Check response logs:**
```
✅ Step 1: Notification saved in DB
✅ Step 2: Found users with FCM tokens
   Total users: 2
   Total tokens: 3
✅ Step 3: Collected FCM tokens
✅ Step 4: Sending to Firebase Cloud Messaging
   ✅ Success count: 2
   ❌ Failure count: 1
```

If `Success count: 0`, tokens are INVALID.

---

## 🔧 **Most Likely Issues & Solutions**

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Token not saved** | `Total tokens: 0` in logs | Check if login API saves FCM token |
| **Token expired** | `Success: 0, Failed: 3` | User needs to login again |
| **Wrong Firebase project** | Test send works but notifications don't show | Verify google-services.json matches backend |
| **Channel ID mismatch** | No notifications in Android 8+ | Use `default_notification_channel` |
| **Priority not set** | Notifications don't show in foreground | Add `android.priority: "high"` |

---

## 📱 **Frontend Changes Needed**

Make sure frontend is:
1. ✅ Requesting notification permission after login
2. ✅ Sending FCM token to backend after login
3. ✅ Using correct channel ID: `default_notification_channel`

All of this is already done in your frontend!

---

## ✅ **Verification Checklist**

- [ ] Backend has updated notification controller (use FIXED version)
- [ ] Firebase Admin SDK is initialized in backend
- [ ] Database has `fcmTokens` array field in User schema
- [ ] Login API saves FCM token from frontend
- [ ] Notification channel is created on Android
- [ ] Device has notification permission granted
- [ ] Device hasn't revoked notification permission
- [ ] Same Firebase project on frontend and backend

---

## 🆘 **If Still Not Working**

1. **Check backend logs** when admin notification is sent
2. **Get device token** with `await checkStoredToken()`
3. **Test with device token** using `/api/notification/test-send` endpoint
4. **Verify Firebase project ID** matches on both sides
5. **Check if tokens are being removed** as invalid

---

## 📊 **Debug Endpoints (New)**

Add these routes to your backend if not exists:

```javascript
// Get all users and their tokens
GET /api/notification/debug/tokens

// Send to specific token (for testing)
POST /api/notification/test-send
{
  "fcmToken": "...",
  "title": "Test",
  "message": "Test message"
}

// Check Firebase config
GET /api/notification/debug/firebase-config
```

---

**Key Point:** If `await checkStoredToken()` shows a token but `debug/tokens` doesn't have it, the login API isn't saving the token to database!
