# Admin Notifications Not Working - Diagnostic & Fix Guide

## Issue Summary
✅ **Login Notifications Work** - System notifications (like "Login Successful") are being received
❌ **Admin Notifications Missing** - Notifications sent by admin from the backend are NOT being received

## Root Cause Analysis

The frontend is working perfectly:
- FCM is initialized ✅
- FCM token is obtained and stored ✅
- FCM token is sent to backend after login ✅
- Notification handlers are properly configured ✅
- Android notification service is running ✅

**The problem is on the BACKEND side.**

## Backend Diagnostic Checklist

### 1. **Check User FCM Token Storage**
Verify that when a user logs in, their FCM token is being saved to the database:

```sql
-- MySQL: Check if user's FCM token is stored
SELECT id, email, fcm_token, created_at FROM users WHERE email = 'user@example.com';
```

**What to look for:**
- User record exists ✓
- `fcm_token` field is NOT NULL ✓
- `fcm_token` contains a valid token (60+ character string) ✓
- Token is updated on every login ✓

### 2. **Verify Admin Notification API Endpoint**
Check if your backend has a notification endpoint that sends to users:

```
POST /api/notification/send
or
POST /api/admin/notification/send
or
POST /notifications/send
```

The endpoint should:
1. Accept notification data (title, body, targetUserId, etc.)
2. Look up user's FCM token from database
3. Send notification to Firebase Cloud Messaging with that token

### 3. **Check Firebase Admin SDK Configuration**
Your backend must be using Firebase Admin SDK to send notifications:

```javascript
// Example Node.js/Express code
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'your-project-id'
});

// Send notification to a user
async function sendNotificationToUser(userId, title, body) {
  try {
    // Get user's FCM token from database
    const user = await User.findById(userId);
    
    if (!user || !user.fcmToken) {
      console.error('User not found or has no FCM token');
      return;
    }
    
    // Send to Firebase
    const message = {
      notification: {
        title: title,
        body: body
      },
      token: user.fcmToken
    };
    
    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
    return response;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
```

### 4. **Check Admin Panel/Dashboard**
When admin sends a notification:
1. Verify the API endpoint is being called
2. Check backend logs for any errors
3. Verify the correct user ID is being targeted
4. Check if Firebase Admin SDK is returning success response

### 5. **Verify FCM Token Update on Login**
Frontend sends FCM token in login request:
```javascript
// Frontend sends this
POST /auth/login
{
  "email": "user@example.com",
  "password": "password",
  "fcmToken": "abc123def456..." // Long token string
}
```

Backend must save this token:
```javascript
// Backend login controller
const user = await User.findOne({ email });
if (user && isPasswordValid) {
  // IMPORTANT: Save or update FCM token
  user.fcmToken = req.body.fcmToken;
  await user.save();
  
  return { success: true, token: jwtToken, user: user };
}
```

## What Frontend Already Does Correctly ✅

1. **Requests notification permission** - App asks user for permission
2. **Gets FCM token** - Retrieves unique token from Firebase
3. **Stores FCM token** - Saves to phone's local storage
4. **Sends on login** - Sends token to backend during login
5. **Registers handlers** - Sets up Firebase message listeners
6. **Shows notifications** - Native Android service displays notifications

## Testing Checklist

### On Android Phone:
1. ✅ Open app and see "Login Successful" notification
2. ✅ Check notification appears in notification tray
3. ✅ Check App > Settings > Notifications - should show permission granted

### On Backend (Testing Admin Notification):
1. [ ] Get user's FCM token from database
2. [ ] Manually call Firebase Admin SDK send notification
3. [ ] Check if notification appears on phone
4. [ ] Check Firebase Console for any errors
5. [ ] Check backend logs for errors

### Firebase Console Checks:
1. [ ] Go to Firebase Console > Cloud Messaging
2. [ ] Send test notification to FCM token
3. [ ] Verify notification arrives on phone

## Files That Need Backend Changes

- **Backend User Model** - Ensure `fcmToken` field exists
- **Backend Login Controller** - Update FCM token on login
- **Backend Notification Service** - Use Firebase Admin SDK to send
- **Backend Admin Endpoint** - Accept and process admin notifications

## Files That Are Already Correct (Frontend)

✅ `src/utils/fcmService.js` - FCM initialization and handlers
✅ `src/screens/LoginScreen.js` - Sends FCM token after login
✅ `src/services/api.js` - API call to send token
✅ `android/app/src/main/java/.../FCMNotificationService.java` - Displays notifications

## Next Steps

1. **Check backend database** - Verify FCM token is being saved
2. **Test Firebase Admin SDK** - Send test notification directly
3. **Check admin notification endpoint** - Ensure it uses Firebase Admin SDK
4. **Enable Firebase logs** - Check for any errors in Firebase
5. **Check phone permissions** - Ensure notifications are not blocked

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Backend doesn't save FCM token | Add `user.fcmToken = req.body.fcmToken` in login |
| Firebase Admin SDK not initialized | Initialize with service account JSON |
| Notifications sent but don't appear | Check phone notification settings |
| Wrong user gets notification | Verify user ID targeting in notification send |
| Token expires | Token should be updated on every login |

## Contact Firebase Support
If notifications still don't work after checking above:
1. Check Firebase Cloud Messaging quota limits
2. Verify Firebase project has billing enabled
3. Check service account has proper permissions
