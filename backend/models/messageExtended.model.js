import mongoose from "mongoose";

/**
 * MessageExtended Model
 * Stores additional metadata for messages without modifying the original Message model
 * Supports: replies, forwards, reactions, disappearing messages, edit history
 */
const messageExtendedSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      required: true,
      unique: true,
      index: true,
    },

    // ── Reply Feature ─────────────────────────────────────────────────────────
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      default: null,
    },
    replyToText: {
      type: String, // Cache original message text for quick display
      default: null,
    },
    replyToSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── Forward Feature ───────────────────────────────────────────────────────
    isForwarded: {
      type: Boolean,
      default: false,
    },
    originalMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      default: null,
    },
    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    forwardCount: {
      type: Number,
      default: 0,
    },

    // ── Reactions ─────────────────────────────────────────────────────────────
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Disappearing Messages ─────────────────────────────────────────────────
    isDisappearing: {
      type: Boolean,
      default: false,
    },
    disappearAfter: {
      type: Number, // Duration in milliseconds
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true, // For efficient cleanup queries
    },

    // ── Edit History ──────────────────────────────────────────────────────────
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        previousText: String,
        previousIv: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Additional Metadata ───────────────────────────────────────────────────
    isPinned: {
      type: Boolean,
      default: false,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tags: [String],

    // ── Delivery Tracking ─────────────────────────────────────────────────────
    deliveredAt: {
      type: Date,
      default: null,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes for Performance ──────────────────────────────────────────────────
messageExtendedSchema.index({ messageId: 1 });
messageExtendedSchema.index({ replyTo: 1 });
messageExtendedSchema.index({ expiresAt: 1 }, { sparse: true });
messageExtendedSchema.index({ "reactions.userId": 1 });

// ── TTL Index for Auto-Deletion ──────────────────────────────────────────────
// MongoDB will automatically delete documents when expiresAt is reached
messageExtendedSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isDisappearing: true } }
);

const MessageExtended = mongoose.model("MessageExtended", messageExtendedSchema);

export default MessageExtended;
