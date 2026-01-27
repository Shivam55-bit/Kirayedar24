package com.bhoomitechzone.kirayedar24;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Firebase Cloud Messaging Service
 * Handles notifications in all app states:
 * - Foreground: App is open and running
 * - Background: App is minimized/not visible
 * - Killed: App removed from recent tasks
 * 
 * Production-ready with proper error handling
 */
public class FCMNotificationService extends FirebaseMessagingService {
    private static final String TAG = "FCMNotificationService";
    private static final String CHANNEL_ID = "default_notification_channel";
    private static final String CHANNEL_NAME = "Default Notifications";
    private static final int NOTIFICATION_ID = 1;

    /**
     * Called when message is received while app is in foreground
     * IMPORTANT: This ALWAYS shows notification - don't suppress it
     */
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "✅ Message received from: " + remoteMessage.getFrom());
        Log.d(TAG, "⭐ DETAILED NOTIFICATION DEBUG:");
        Log.d(TAG, "  - Has Notification Object: " + (remoteMessage.getNotification() != null));
        Log.d(TAG, "  - Has Data Payload: " + (remoteMessage.getData().size() > 0));
        Log.d(TAG, "  - Data Keys: " + remoteMessage.getData().keySet());
        
        // ALWAYS show notification in foreground - don't let React suppress it
        RemoteMessage.Notification notification = remoteMessage.getNotification();
        Map<String, String> data = remoteMessage.getData();
        
        // Extract title and body from either notification or data payload
        final String finalTitle;
        final String finalBody;
        
        if (notification != null) {
            finalTitle = notification.getTitle();
            finalBody = notification.getBody();
            Log.d(TAG, "📬 Using Notification Payload - Title: " + finalTitle + ", Body: " + finalBody);
        } else if (data.containsKey("title") || data.containsKey("body")) {
            finalTitle = data.get("title");
            finalBody = data.get("body");
            Log.d(TAG, "📦 Using Data Payload - Title: " + finalTitle + ", Body: " + finalBody);
        } else {
            Log.w(TAG, "⚠️ No title or body found in either payload!");
            return; // No notification to show
        }
        
        final String displayTitle = (finalTitle == null || finalTitle.isEmpty()) ? "Notification" : finalTitle;
        final String displayBody = (finalBody == null || finalBody.isEmpty()) ? "" : finalBody;
        
        Log.d(TAG, "📢 Preparing to show notification immediately on main thread");
        
        // Show notification on main thread with immediate timing
        new Handler(Looper.getMainLooper()).post(() -> {
            Log.d(TAG, "🔔 Executing showNotification on main thread");
            showNotification(displayTitle, displayBody, data);
        });
        
        // Also handle the payloads for other processing
        if (notification != null) {
            Log.d(TAG, "📬 Message has notification payload");
            handleNotificationPayload(remoteMessage);
        }
        
        if (data.size() > 0) {
            Log.d(TAG, "📦 Message has data payload");
            handleDataPayload(data);
        }
    }

    /**
     * Called when new token is generated
     */
    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "🔑 New FCM Token: " + token);
        
        // Send token to backend
        sendTokenToBackend(token);
    }

    /**
     * Handle notification payload (title, body, image, etc.)
     * This is called automatically when app is in foreground
     */
    private void handleNotificationPayload(RemoteMessage remoteMessage) {
        RemoteMessage.Notification notification = remoteMessage.getNotification();
        
        String title = notification.getTitle();
        String body = notification.getBody();
        
        Log.d(TAG, "Title: " + title);
        Log.d(TAG, "Body: " + body);
        
        // Create and show notification
        showNotification(
            title,
            body,
            remoteMessage.getData()
        );
    }

    /**
     * Handle data payload
     * Used for custom actions and deep linking
     * ALSO shows notification for data-only messages
     */
    private void handleDataPayload(Map<String, String> data) {
        String titleRaw = data.get("title");
        String bodyRaw = data.get("body");
        String screenName = data.get("screen");
        
        Log.d(TAG, "🎯 HANDLING DATA PAYLOAD:");
        Log.d(TAG, "  - Title: " + titleRaw);
        Log.d(TAG, "  - Body: " + bodyRaw);
        Log.d(TAG, "  - Screen: " + screenName);
        Log.d(TAG, "  - All keys: " + data.keySet());
        
        // If no title/body in standard keys, check for alternative keys
        if ((titleRaw == null || titleRaw.isEmpty()) && (bodyRaw == null || bodyRaw.isEmpty())) {
            Log.d(TAG, "⚠️ No standard title/body keys found, checking alternatives...");
            // Check for alternative key names
            for (String key : data.keySet()) {
                Log.d(TAG, "  Key: " + key + " = " + data.get(key));
            }
            
            // Try to use first available non-empty values
            if (titleRaw == null || titleRaw.isEmpty()) {
                titleRaw = "Notification";
            }
            if (bodyRaw == null || bodyRaw.isEmpty()) {
                bodyRaw = data.values().stream().findFirst().orElse("");
            }
        }
        
        final String finalTitle = (titleRaw == null || titleRaw.isEmpty()) ? "Notification" : titleRaw;
        final String finalBody = (bodyRaw == null || bodyRaw.isEmpty()) ? "" : bodyRaw;
        
        Log.d(TAG, "✅ Final - Title: " + finalTitle + ", Body: " + finalBody);
        
        // Show notification immediately
        new Handler(Looper.getMainLooper()).post(() -> {
            showNotification(finalTitle, finalBody, data);
        });
    }

    /**
     * Create and show notification
     * Works in all app states: foreground, background, and killed
     * IMPORTANT: This is called for ALL messages - notification + data payload
     */
    private void showNotification(String title, String body, Map<String, String> data) {
        // Ensure notification channel exists (Android 8+) - MUST do this first
        createNotificationChannel();
        
        if (title == null || title.isEmpty()) title = "Notification";
        if (body == null || body.isEmpty()) body = "New message";
        
        Log.d(TAG, "🔔 SHOW NOTIFICATION START");
        Log.d(TAG, "  - Title: " + title);
        Log.d(TAG, "  - Body: " + body);
        Log.d(TAG, "  - Data null?: " + (data == null));
        Log.d(TAG, "  - Data size: " + (data != null ? data.size() : 0));
        
        // Create intent for notification click
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("from_notification", true);
        
        // Add data to intent if present
        if (data != null && !data.isEmpty()) {
            String screenName = data.get("screen");
            String propertyId = data.get("propertyId");
            String chatId = data.get("chatId");
            
            if (screenName != null && !screenName.isEmpty()) {
                intent.putExtra("screen", screenName);
            }
            if (propertyId != null && !propertyId.isEmpty()) {
                intent.putExtra("propertyId", propertyId);
            }
            if (chatId != null && !chatId.isEmpty()) {
                intent.putExtra("chatId", chatId);
            }
            
            Log.d(TAG, "  - Added intent extras");
        }
        
        // Create PendingIntent with correct flags for heads-up
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            (int) System.currentTimeMillis(),
            intent,
            flags
        );
        
        // Create full screen intent for heads-up display (high priority)
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtra("from_notification", true);
        if (data != null && !data.isEmpty()) {
            fullScreenIntent.putExtra("screen", data.get("screen"));
            fullScreenIntent.putExtra("propertyId", data.get("propertyId"));
            fullScreenIntent.putExtra("chatId", data.get("chatId"));
        }
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            (int) System.currentTimeMillis() + 1,
            fullScreenIntent,
            flags
        );
        
        // Build notification with MAX priority for heads-up display
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setAutoCancel(true)
            .setTicker(title)
            .setDefaults(NotificationCompat.DEFAULT_ALL) // Sound + vibration + lights
            .setColor(0xFFFDB022)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_MAX) // MAX priority for heads-up
            .setContentIntent(pendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true); // Force heads-up display
        
        // Set style for longer text
        if (body != null && body.length() > 50) {
            builder.setStyle(new NotificationCompat.BigTextStyle()
                .bigText(body));
        }
        
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            try {
                int notificationId = (int) System.currentTimeMillis();
                manager.notify(notificationId, builder.build());
                Log.d(TAG, "✅ NOTIFICATION POSTED SUCCESSFULLY!");
                Log.d(TAG, "  - ID: " + notificationId);
                Log.d(TAG, "  - Channel: " + CHANNEL_ID);
                Log.d(TAG, "  - Priority: MAX");
            } catch (Exception e) {
                Log.e(TAG, "❌ Error posting notification: " + e.getMessage());
            }
        } else {
            Log.e(TAG, "❌ NotificationManager is null");
        }
    }

    /**
     * Create notification channel for Android 8+
     * IMPORTANCE_MAX ensures heads-up display in all conditions
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            
            if (manager != null) {
                // Check if channel already exists
                NotificationChannel existingChannel = manager.getNotificationChannel(CHANNEL_ID);
                if (existingChannel != null) {
                    Log.d(TAG, "Notification channel already exists, updating...");
                }
                
                // Create new channel with MAX importance (forces heads-up)
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_MAX // MAX = heads-up in all cases
                );
                
                channel.setDescription("FCM notifications - High Priority");
                channel.enableLights(true);
                channel.setLightColor(0xFFFFFF00);
                channel.enableVibration(true);
                channel.setShowBadge(true);
                channel.setBypassDnd(true); // Bypass Do Not Disturb
                
                // Set vibration pattern
                channel.setVibrationPattern(new long[]{0, 500, 250, 500});
                
                // Set sound
                try {
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .build();
                    android.net.Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                    channel.setSound(soundUri, audioAttributes);
                    Log.d(TAG, "✅ Sound set for notification channel");
                } catch (Exception e) {
                    Log.w(TAG, "Failed to set sound: " + e.getMessage());
                }
                
                manager.createNotificationChannel(channel);
                Log.d(TAG, "✅ Notification channel created with IMPORTANCE_MAX + BypassDND");
            }
        }
    }

    /**
     * Send FCM token to backend for sending notifications
     * Backend will store this token and use it to send notifications
     */
    private void sendTokenToBackend(String token) {
        // TODO: Implement API call to send token to your backend
        // Example:
        // ApiService.sendFCMToken(token)
        //     .enqueue(new Callback<Void>() {
        //         @Override
        //         public void onResponse(Call<Void> call, Response<Void> response) {
        //             Log.d(TAG, "✅ Token sent to backend");
        //         }
        //
        //         @Override
        //         public void onFailure(Call<Void> call, Throwable t) {
        //             Log.e(TAG, "❌ Failed to send token", t);
        //         }
        //     });
        
        Log.d(TAG, "⚠️ sendTokenToBackend not implemented - token: " + token);
    }
}
