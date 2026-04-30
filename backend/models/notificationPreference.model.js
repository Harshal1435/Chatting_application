import mongoose from "mongoose";

/**
 * NotificationPreference Model
 * Stores user notification settings and push subscription details
 */
const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ── Push Notification Subscription ────────────────────────────────────────
    pushSubscriptions: [
      {
        endpoint: {
          type: String,
          required: true,
        },
        keys: {
          p256dh: {
            type: String,
            required: true,
          },
          auth: {
            type: String,
            required: true,
          },
        },
        deviceInfo: {
          userAgent: String,
          platform: String,
          deviceName: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Global Notification Settings ──────────────────────────────────────────
    enabled: {
      type: Boolean,
      default: true,
    },

    // ── Notification Types ────────────────────────────────────────────────────
    notificationTypes: {
      messages: {
        type: Boolean,
        default: true,
      },
      calls: {
        type: Boolean,
        default: true,
      },
      groupMessages: {
        type: Boolean,
        default: true,
      },
      mentions: {
        type: Boolean,
        default: true,
      },
      reactions: {
        type: Boolean,
        default: true,
      },
      followRequests: {
        type: Boolean,
        default: true,
      },
      statusUpdates: {
        type: Boolean,
        default: false,
      },
    },

    // ── Do Not Disturb ────────────────────────────────────────────────────────
    doNotDisturb: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startTime: {
        type: String, // Format: "22:00"
        default: "22:00",
      },
      endTime: {
        type: String, // Format: "08:00"
        default: "08:00",
      },
      days: {
        type: [String], // ["monday", "tuesday", ...]
        default: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      },
    },

    // ── Per-Conversation Settings ─────────────────────────────────────────────
    mutedConversations: [
      {
        conversationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "conversation",
        },
        mutedUntil: {
          type: Date,
          default: null, // null = muted forever
        },
        mutedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Sound & Vibration ─────────────────────────────────────────────────────
    sound: {
      enabled: {
        type: Boolean,
        default: true,
      },
      customSound: {
        type: String,
        default: "default",
      },
    },
    vibration: {
      type: Boolean,
      default: true,
    },

    // ── Preview Settings ──────────────────────────────────────────────────────
    showPreview: {
      type: Boolean,
      default: true, // Show message content in notification
    },
    showSenderName: {
      type: Boolean,
      default: true,
    },

    // ── Notification Grouping ─────────────────────────────────────────────────
    groupNotifications: {
      type: Boolean,
      default: true, // Group multiple notifications from same conversation
    },

    // ── Priority Contacts ─────────────────────────────────────────────────────
    priorityContacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Always notify, even in DND mode
  },
  { timestamps: true }
);

// ── Methods ───────────────────────────────────────────────────────────────────

/**
 * Check if user is in Do Not Disturb mode
 */
notificationPreferenceSchema.methods.isInDNDMode = function () {
  if (!this.doNotDisturb.enabled) return false;

  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "lowercase" });
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  // Check if current day is in DND days
  if (!this.doNotDisturb.days.includes(currentDay)) return false;

  const start = this.doNotDisturb.startTime;
  const end = this.doNotDisturb.endTime;

  // Handle overnight DND (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }

  return currentTime >= start && currentTime <= end;
};

/**
 * Check if conversation is muted
 */
notificationPreferenceSchema.methods.isConversationMuted = function (conversationId) {
  const muted = this.mutedConversations.find(
    (m) => m.conversationId.toString() === conversationId.toString()
  );

  if (!muted) return false;

  // If mutedUntil is null, it's muted forever
  if (!muted.mutedUntil) return true;

  // Check if mute period has expired
  return new Date() < muted.mutedUntil;
};

/**
 * Check if user should receive notification
 */
notificationPreferenceSchema.methods.shouldNotify = function (type, conversationId, senderId) {
  // Global notifications disabled
  if (!this.enabled) return false;

  // Specific notification type disabled
  if (this.notificationTypes[type] === false) return false;

  // Conversation is muted
  if (conversationId && this.isConversationMuted(conversationId)) {
    // Check if sender is priority contact (override mute)
    if (senderId && this.priorityContacts.some((id) => id.toString() === senderId.toString())) {
      return true;
    }
    return false;
  }

  // In DND mode
  if (this.isInDNDMode()) {
    // Check if sender is priority contact (override DND)
    if (senderId && this.priorityContacts.some((id) => id.toString() === senderId.toString())) {
      return true;
    }
    return false;
  }

  return true;
};

/**
 * Add or update push subscription
 */
notificationPreferenceSchema.methods.addPushSubscription = function (subscription, deviceInfo) {
  // Remove existing subscription with same endpoint
  this.pushSubscriptions = this.pushSubscriptions.filter(
    (sub) => sub.endpoint !== subscription.endpoint
  );

  // Add new subscription
  this.pushSubscriptions.push({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    deviceInfo,
    createdAt: new Date(),
    lastUsed: new Date(),
  });

  return this.save();
};

/**
 * Remove push subscription
 */
notificationPreferenceSchema.methods.removePushSubscription = function (endpoint) {
  this.pushSubscriptions = this.pushSubscriptions.filter((sub) => sub.endpoint !== endpoint);
  return this.save();
};

// ── Static Methods ────────────────────────────────────────────────────────────

/**
 * Get or create notification preferences for user
 */
notificationPreferenceSchema.statics.getOrCreate = async function (userId) {
  let prefs = await this.findOne({ userId });
  if (!prefs) {
    prefs = await this.create({ userId });
  }
  return prefs;
};

const NotificationPreference = mongoose.model("NotificationPreference", notificationPreferenceSchema);

export default NotificationPreference;
