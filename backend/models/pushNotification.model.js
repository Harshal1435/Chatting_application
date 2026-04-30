import mongoose from "mongoose";

/**
 * Push Notification Preferences Schema
 * Stores user notification settings and device tokens
 */
const pushNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Device tokens for push notifications
    devices: [
      {
        deviceId: {
          type: String,
          required: true,
        },
        platform: {
          type: String,
          enum: ["web", "ios", "android", "desktop"],
          required: true,
        },
        token: {
          type: String,
          required: true,
        },
        endpoint: String, // For web push
        keys: {
          p256dh: String,
          auth: String,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Notification preferences
    preferences: {
      enabled: {
        type: Boolean,
        default: true,
      },

      // Message notifications
      messages: {
        enabled: {
          type: Boolean,
          default: true,
        },
        sound: {
          type: Boolean,
          default: true,
        },
        vibration: {
          type: Boolean,
          default: true,
        },
        preview: {
          type: Boolean,
          default: true, // Show message preview in notification
        },
      },

      // Call notifications
      calls: {
        enabled: {
          type: Boolean,
          default: true,
        },
        sound: {
          type: Boolean,
          default: true,
        },
        vibration: {
          type: Boolean,
          default: true,
        },
      },

      // Group notifications
      groups: {
        enabled: {
          type: Boolean,
          default: true,
        },
        mentionsOnly: {
          type: Boolean,
          default: false,
        },
      },

      // Status notifications
      status: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },

      // Quiet hours
      quietHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        startTime: {
          type: String, // "22:00"
          default: "22:00",
        },
        endTime: {
          type: String, // "08:00"
          default: "08:00",
        },
      },

      // Muted conversations
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
        },
      ],

      // Custom notification sounds
      customSounds: {
        message: String,
        call: String,
        group: String,
      },
    },

    // Notification history (last 100)
    history: [
      {
        type: {
          type: String,
          enum: ["message", "call", "status", "group", "system"],
        },
        title: String,
        body: String,
        data: mongoose.Schema.Types.Mixed,
        sentAt: {
          type: Date,
          default: Date.now,
        },
        delivered: {
          type: Boolean,
          default: false,
        },
        clicked: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
pushNotificationSchema.index({ userId: 1 });
pushNotificationSchema.index({ "devices.token": 1 });
pushNotificationSchema.index({ "devices.isActive": 1 });

// ── Methods ──────────────────────────────────────────────────────────────────
pushNotificationSchema.methods.addDevice = function (deviceData) {
  // Remove existing device with same deviceId
  this.devices = this.devices.filter((d) => d.deviceId !== deviceData.deviceId);
  this.devices.push(deviceData);
  return this.save();
};

pushNotificationSchema.methods.removeDevice = function (deviceId) {
  this.devices = this.devices.filter((d) => d.deviceId !== deviceId);
  return this.save();
};

pushNotificationSchema.methods.isConversationMuted = function (conversationId) {
  const muted = this.preferences.mutedConversations.find(
    (m) => m.conversationId.toString() === conversationId.toString()
  );
  if (!muted) return false;
  if (!muted.mutedUntil) return true; // Muted forever
  return new Date() < muted.mutedUntil;
};

pushNotificationSchema.methods.isInQuietHours = function () {
  if (!this.preferences.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const { startTime, endTime } = this.preferences.quietHours;

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Crosses midnight
    return currentTime >= startTime || currentTime < endTime;
  }
};

const PushNotification = mongoose.model("pushNotification", pushNotificationSchema);

export default PushNotification;
