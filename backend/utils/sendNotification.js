
import admin from "../config/firebase.js";

/**
 * Send push notification via Firebase Cloud Messaging (FCM)
 * Works in foreground, background, and kill mode
 *
 * @param {string | string[]} fcmToken - Single FCM token or array of tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message
 * @param {object} data - Optional custom data payload
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    // Add required FCM click action for Flutter / RN
    const payloadData = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      ...data,
    };

    //  Common Notification Object
    const baseNotification = {
      notification: {
        title,
        body,
      },
      data: payloadData,
      android: {
        priority: "high",
        notification: {
          channelId: "high_importance_channel", // must exist on device
          sound: "default",
          defaultSound: true,
          visibility: "public",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10", // 10 = immediate delivery
        },
        payload: {
          aps: {
            alert: { title, body },
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    //  Single Token
    if (typeof fcmToken === "string") {
      const message = {
        ...baseNotification,
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log(" Notification sent (single):", response);
      return response;
    }

    //  Multiple Tokens
    if (Array.isArray(fcmToken) && fcmToken.length > 0) {
      const message = {
        ...baseNotification,
        tokens: fcmToken,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(
        ` Notifications sent: ${response.successCount}, Failed: ${response.failureCount}`
      );

      if (response.failureCount > 0) {
        response.responses.forEach((res, index) => {
          if (!res.success) {
            console.error(` Failed for token[${index}]:`, res.error?.message);
          }
        });
      }

      return response;
    }

    console.warn(" No FCM token(s) provided!");
    return null;
  } catch (error) {
    console.error(" Error sending FCM notification:", error);
  }
};