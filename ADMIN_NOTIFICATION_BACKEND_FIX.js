/**
 * FIXED ADMIN NOTIFICATION CONTROLLER
 * 
 * Issues Fixed:
 * 1. ✅ Proper notification payload with high priority
 * 2. ✅ Better token validation and logging
 * 3. ✅ APNs configuration for proper notification display
 * 4. ✅ Manual testing endpoint
 * 5. ✅ Token debugging and cleanup
 */

import Notification from "../models/notificationModel.js";
import User from "../models/user.js";
import admin from "../config/firebase.js";

/**
 * FIXED: Create and send admin notification
 * Ensures notifications appear in foreground, background AND killed states
 */
export const createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("📢 ADMIN NOTIFICATION API HIT");
    console.log("=".repeat(60) + "\n");

    // 1️⃣ Save notification in DB
    const notification = new Notification({
      title,
      message,
      from: "admin",
    });

    const saved = await notification.save();
    console.log("✅ Step 1: Notification saved in DB");
    console.log("   ID:", saved._id);

    // 2️⃣ Get users with FCM tokens
    const users = await User.find({
      fcmTokens: { $exists: true, $ne: [] },
    }).select("fcmTokens email _id");

    console.log("\n✅ Step 2: Found users with FCM tokens");
    console.log("   Total users:", users.length);
    
    // Debug: Show token details
    users.forEach((user, idx) => {
      console.log(`   User ${idx + 1}: ${user.email}`);
      user.fcmTokens.forEach((token, tIdx) => {
        console.log(`     Token ${tIdx + 1}: ${token.substring(0, 20)}...`);
      });
    });

    // 3️⃣ Collect all tokens
    const tokens = users.flatMap((u) => u.fcmTokens);
    console.log("\n✅ Step 3: Collected FCM tokens");
    console.log("   Total tokens:", tokens.length);

    if (tokens.length === 0) {
      console.log("\n⚠️  NO TOKENS FOUND!");
      console.log("   This means NO users have FCM tokens stored");
      console.log("   Check: Did users' FCM tokens get saved after login?");
      
      return res.status(201).json({
        success: true,
        message: "Notification saved (no users with token)",
        data: saved,
        debug: {
          totalUsers: users.length,
          tokensFound: tokens.length
        }
      });
    }

    // 4️⃣ FIXED: Send with proper payload structure
    console.log("\n✅ Step 4: Sending to Firebase Cloud Messaging");
    
    // IMPORTANT: This payload structure ensures notifications display correctly
    const payload = {
      tokens,
      notification: {
        title: title,
        body: message,
        // IMPORTANT: These help with notification display on different devices
        sound: "default",
      },
      data: {
        notificationId: saved._id.toString(),
        from: "admin",
        timestamp: new Date().toISOString(),
        // Add title and body to data payload too (fallback for some devices)
        title: title,
        body: message,
      },
      // CRITICAL: Android-specific settings for notification display
      android: {
        priority: "high", // IMPORTANT: Ensures notification shows in foreground
        notification: {
          sound: "default",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          channelId: "default_notification_channel",
          priority: "high",
          visibility: "public",
        },
      },
      // For iOS devices
      apns: {
        headers: {
          "apns-priority": "10", // High priority
        },
        payload: {
          aps: {
            "content-available": 1,
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    console.log("   📤 Firebase Response:");
    console.log("      ✅ Success count:", response.successCount);
    console.log("      ❌ Failure count:", response.failureCount);
    console.log("      Total sent:", response.successCount + response.failureCount);

    // 5️⃣ FIXED: Better error handling and token cleanup
    console.log("\n✅ Step 5: Handling failed tokens");
    
    let removedCount = 0;
    const failedTokens = [];
    
    for (let i = 0; i < response.responses.length; i++) {
      if (!response.responses[i].success) {
        const error = response.responses[i].error;
        const errorCode = error.code;
        const token = tokens[i];

        console.log(`\n   ❌ Token ${i + 1} failed:`);
        console.log(`      Token: ${token.substring(0, 20)}...`);
        console.log(`      Error: ${errorCode}`);
        console.log(`      Message: ${error.message}`);

        // Remove invalid tokens
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/mismatched-credential" ||
          errorCode === "messaging/message-rate-exceeded"
        ) {
          const result = await User.updateMany(
            { fcmTokens: token },
            { $pull: { fcmTokens: token } }
          );
          
          console.log(`      🗑️  Removed from DB (updated ${result.modifiedCount} user records)`);
          removedCount++;
          failedTokens.push(token.substring(0, 20) + "...");
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Sent successfully: ${response.successCount}/${tokens.length}`);
    console.log(`❌ Failed: ${response.failureCount}/${tokens.length}`);
    console.log(`🗑️  Removed invalid tokens: ${removedCount}`);
    console.log("=".repeat(60) + "\n");

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${response.successCount} users`,
      data: saved,
      push: {
        success: response.successCount,
        failed: response.failureCount,
        removed: removedCount,
      },
      debug: {
        totalTokens: tokens.length,
        failedTokens: failedTokens,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("\n🔥 ERROR IN createNotification:");
    console.error("   Code:", error.code);
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
      debug: {
        code: error.code,
        type: error.constructor.name,
      }
    });
  }
};

/**
 * TEST: Send notification to specific user/token
 * Use this to test with exact token from frontend
 * 
 * Request:
 * POST /api/notification/test-send
 * {
 *   "userId": "user_id_from_frontend",
 *   "fcmToken": "exact_token_from_device",
 *   "title": "Test Notification",
 *   "message": "This is a test"
 * }
 */
export const testSendNotification = async (req, res) => {
  try {
    const { userId, fcmToken, title = "Test", message = "Test message" } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "fcmToken is required",
      });
    }

    console.log("\n🧪 TEST NOTIFICATION");
    console.log("   Token:", fcmToken.substring(0, 20) + "...");
    console.log("   Title:", title);
    console.log("   Message:", message);

    const payload = {
      token: fcmToken,
      notification: {
        title,
        body: message,
        sound: "default",
      },
      data: {
        type: "test_notification",
        timestamp: new Date().toISOString(),
        title,
        body: message,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          priority: "high",
          visibility: "public",
          channelId: "default_notification_channel",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            "content-available": 1,
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(payload);
    
    console.log("✅ Sent:", response);

    return res.status(200).json({
      success: true,
      message: "Test notification sent",
      messageId: response,
    });

  } catch (error) {
    console.error("❌ Test send error:", error.message);
    
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error.code,
    });
  }
};

/**
 * DEBUG: Get all users with their FCM tokens
 * Use this to verify tokens are stored correctly
 * 
 * GET /api/notification/debug/tokens
 */
export const debugGetAllTokens = async (req, res) => {
  try {
    const users = await User.find({
      fcmTokens: { $exists: true, $ne: [] },
    }).select("_id email fcmTokens createdAt updatedAt");

    const data = users.map(user => ({
      userId: user._id,
      email: user.email,
      tokenCount: user.fcmTokens.length,
      tokens: user.fcmTokens.map(t => t.substring(0, 20) + "..."),
      lastUpdated: user.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      totalUsers: users.length,
      totalTokens: users.reduce((sum, u) => sum + u.fcmTokens.length, 0),
      data,
    });

  } catch (error) {
    console.error("Debug error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DEBUG: Check Firebase configuration
 * Verify Firebase Admin SDK is properly initialized
 */
export const debugCheckFirebaseConfig = async (req, res) => {
  try {
    console.log("🔍 Checking Firebase Configuration...");

    // Try to get app info
    const appCheck = admin.app();
    console.log("✅ Firebase App initialized:", !!appCheck);

    // Try to initialize messaging
    const messaging = admin.messaging();
    console.log("✅ Firebase Messaging initialized:", !!messaging);

    return res.status(200).json({
      success: true,
      message: "Firebase is properly configured",
      config: {
        appInitialized: !!appCheck,
        messagingInitialized: !!messaging,
        projectId: admin.app().options.projectId,
      }
    });

  } catch (error) {
    console.error("Config check error:", error);
    return res.status(500).json({
      success: false,
      message: "Firebase configuration error",
      error: error.message,
    });
  }
};

export default {
  createNotification,
  testSendNotification,
  debugGetAllTokens,
  debugCheckFirebaseConfig,
};
