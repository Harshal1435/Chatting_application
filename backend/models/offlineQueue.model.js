import mongoose from "mongoose";

/**
 * OfflineQueue Model
 * Stores messages to be delivered when user comes online
 * Supports priority-based delivery and retry mechanism
 */
const offlineQueueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Priority System ───────────────────────────────────────────────────────
    priority: {
      type: String,
      enum: ["urgent", "high", "normal", "low"],
      default: "normal",
      index: true,
    },

    // ── Delivery Status ───────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "failed"],
      default: "pending",
      index: true,
    },

    // ── Retry Mechanism ───────────────────────────────────────────────────────
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },

    // ── Error Tracking ────────────────────────────────────────────────────────
    lastError: {
      type: String,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },

    // ── Delivery Tracking ─────────────────────────────────────────────────────
    deliveredAt: {
      type: Date,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },

    // ── Metadata ──────────────────────────────────────────────────────────────
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "call"],
      default: "text",
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversation",
    },

    // ── Expiry ────────────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },
  },
  { timestamps: true }
);

// ── Compound Indexes for Efficient Queries ───────────────────────────────────
offlineQueueSchema.index({ userId: 1, status: 1, priority: -1, createdAt: 1 });
offlineQueueSchema.index({ status: 1, nextRetryAt: 1 });
offlineQueueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── Methods ───────────────────────────────────────────────────────────────────

/**
 * Mark message as delivered
 */
offlineQueueSchema.methods.markDelivered = async function () {
  this.status = "delivered";
  this.deliveredAt = new Date();
  return this.save();
};

/**
 * Mark message as failed and schedule retry
 */
offlineQueueSchema.methods.markFailed = async function (error) {
  this.retryCount += 1;
  this.lastError = error;

  if (this.retryCount >= this.maxRetries) {
    this.status = "failed";
    this.failedAt = new Date();
  } else {
    // Exponential backoff: 1min, 5min, 15min
    const backoffMinutes = Math.pow(5, this.retryCount);
    this.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
    this.status = "pending";
  }

  return this.save();
};

// ── Static Methods ────────────────────────────────────────────────────────────

/**
 * Get pending messages for a user, ordered by priority
 */
offlineQueueSchema.statics.getPendingForUser = function (userId) {
  const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };

  return this.find({
    userId,
    status: "pending",
    $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: new Date() } }],
  })
    .sort({ priority: -1, createdAt: 1 })
    .populate("messageId senderId", "fullname avatar")
    .limit(50); // Batch size
};

/**
 * Clean up old delivered/failed messages
 */
offlineQueueSchema.statics.cleanup = function () {
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  return this.deleteMany({
    $or: [
      { status: "delivered", deliveredAt: { $lt: cutoffDate } },
      { status: "failed", failedAt: { $lt: cutoffDate } },
    ],
  });
};

const OfflineQueue = mongoose.model("OfflineQueue", offlineQueueSchema);

export default OfflineQueue;
