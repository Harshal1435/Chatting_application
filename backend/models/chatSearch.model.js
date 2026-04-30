import mongoose from "mongoose";

/**
 * Chat Search Index Schema
 * Optimized search index for fast message searching
 */
const chatSearchSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      required: true,
      unique: true,
      index: true,
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Searchable content (decrypted for indexing)
    content: {
      type: String,
      required: true,
      index: "text",
    },

    // Metadata for filtering
    hasAttachment: {
      type: Boolean,
      default: false,
    },

    attachmentTypes: [
      {
        type: String,
        enum: ["image", "video", "audio", "document", "voice"],
      },
    ],

    isForwarded: {
      type: Boolean,
      default: false,
    },

    hasReply: {
      type: Boolean,
      default: false,
    },

    // Search optimization
    keywords: [String], // Extracted keywords for faster search

    // Timestamp for sorting
    messageTimestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ── Compound Indexes for Performance ────────────────────────────────────────
chatSearchSchema.index({ content: "text", messageTimestamp: -1 });
chatSearchSchema.index({ conversationId: 1, messageTimestamp: -1 });
chatSearchSchema.index({ senderId: 1, receiverId: 1, messageTimestamp: -1 });
chatSearchSchema.index({ hasAttachment: 1, attachmentTypes: 1 });

// ── Static Methods ───────────────────────────────────────────────────────────
chatSearchSchema.statics.searchMessages = async function (query, filters = {}) {
  const searchQuery = {
    $text: { $search: query },
  };

  if (filters.conversationId) {
    searchQuery.conversationId = filters.conversationId;
  }

  if (filters.senderId) {
    searchQuery.senderId = filters.senderId;
  }

  if (filters.hasAttachment !== undefined) {
    searchQuery.hasAttachment = filters.hasAttachment;
  }

  if (filters.attachmentTypes && filters.attachmentTypes.length > 0) {
    searchQuery.attachmentTypes = { $in: filters.attachmentTypes };
  }

  if (filters.dateFrom) {
    searchQuery.messageTimestamp = { $gte: new Date(filters.dateFrom) };
  }

  if (filters.dateTo) {
    searchQuery.messageTimestamp = {
      ...searchQuery.messageTimestamp,
      $lte: new Date(filters.dateTo),
    };
  }

  return this.find(searchQuery)
    .sort({ score: { $meta: "textScore" }, messageTimestamp: -1 })
    .limit(filters.limit || 50)
    .populate("messageId")
    .populate("senderId", "fullname profilePic")
    .populate("receiverId", "fullname profilePic");
};

const ChatSearch = mongoose.model("chatSearch", chatSearchSchema);

export default ChatSearch;
