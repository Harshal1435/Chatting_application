import webpush from "web-push";
import NotificationPreference from "../models/notificationPreference.model.js";

// Configure web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@chatapp.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Subscribe to push notifications
 */
export const subscribe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subscription, deviceInfo } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription" });
    }

    // Get or create notification preferences
    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId });
    }

    // Add subscription
    await prefs.addPushSubscription(subscription, deviceInfo);

    res.status(200).json({
      success: true,
      message: "Subscribed to push notifications",
    });
  } catch (error) {
    console.error("Error in subscribe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { endpoint } = req.body;

    const prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      return res.status(404).json({ error: "Notification preferences not found" });
    }

    await prefs.removePushSubscription(endpoint);

    res.status(200).json({
      success: true,
      message: "Unsubscribed from push notifications",
    });
  } catch (error) {
    console.error("Error in unsubscribe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId, ...updates });
    } else {
      Object.assign(prefs, updates);
      await prefs.save();
    }

    res.status(200).json({
      success: true,
      preferences: prefs,
    });
  } catch (error) {
    console.error("Error in updatePreferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get notification preferences
 */
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user._id;

    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId });
    }

    res.status(200).json({
      success: true,
      preferences: prefs,
    });
  } catch (error) {
    console.error("Error in getPreferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Mute conversation
 */
export const muteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, duration } = req.body; // duration in milliseconds, null = forever

    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId });
    }

    // Remove existing mute for this conversation
    prefs.mutedConversations = prefs.mutedConversations.filter(
      (m) => m.conversationId.toString() !== conversationId
    );

    // Add new mute
    const mutedUntil = duration ? new Date(Date.now() + duration) : null;
    prefs.mutedConversations.push({
      conversationId,
      mutedUntil,
      mutedAt: new Date(),
    });

    await prefs.save();

    res.status(200).json({
      success: true,
      message: "Conversation muted",
      mutedUntil,
    });
  } catch (error) {
    console.error("Error in muteConversation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Unmute conversation
 */
export const unmuteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.body;

    const prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      return res.status(404).json({ error: "Notification preferences not found" });
    }

    prefs.mutedConversations = prefs.mutedConversations.filter(
      (m) => m.conversationId.toString() !== conversationId
    );

    await prefs.save();

    res.status(200).json({
      success: true,
      message: "Conversation unmuted",
    });
  } catch (error) {
    console.error("Error in unmuteConversation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Send push notification to user
 * This is called internally by the system, not exposed as API endpoint
 */
export const sendPushNotification = async (userId, notificationData) => {
  try {
    const prefs = await NotificationPreference.findOne({ userId });
    if (!prefs || !prefs.enabled) {
      console.log(`Push notifications disabled for user ${userId}`);
      return;
    }

    // Check if user should receive this notification
    const shouldNotify = prefs.shouldNotify(
      notificationData.type,
      notificationData.data?.conversationId,
      notificationData.data?.senderId
    );

    if (!shouldNotify) {
      console.log(`Notification blocked by user preferences for user ${userId}`);
      return;
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notificationData.title,
      body: prefs.showPreview ? notificationData.body : "New message",
      icon: notificationData.icon || "/icon.png",
      badge: "/badge.png",
      data: notificationData.data,
      tag: notificationData.data?.conversationId || "general",
      requireInteraction: false,
      actions: [
        { action: "open", title: "Open" },
        { action: "close", title: "Close" },
      ],
    });

    // Send to all subscribed devices
    const sendPromises = prefs.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload
        );

        // Update last used timestamp
        sub.lastUsed = new Date();
        console.log(`✅ Push notification sent to user ${userId}`);
      } catch (error) {
        console.error(`Error sending push notification to ${sub.endpoint}:`, error);

        // Remove invalid subscriptions (410 = Gone, 404 = Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Removing invalid subscription: ${sub.endpoint}`);
          await prefs.removePushSubscription(sub.endpoint);
        }
      }
    });

    await Promise.all(sendPromises);
    await prefs.save();
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
    throw error;
  }
};

/**
 * Test push notification
 */
export const testNotification = async (req, res) => {
  try {
    const userId = req.user._id;

    await sendPushNotification(userId, {
      type: "test",
      title: "Test Notification",
      body: "This is a test notification from your chat app!",
      icon: "/icon.png",
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Test notification sent",
    });
  } catch (error) {
    console.error("Error in testNotification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get VAPID public key
 */
export const getVapidPublicKey = async (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
      return res.status(500).json({ error: "VAPID keys not configured" });
    }

    res.status(200).json({
      success: true,
      publicKey,
    });
  } catch (error) {
    console.error("Error in getVapidPublicKey:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
