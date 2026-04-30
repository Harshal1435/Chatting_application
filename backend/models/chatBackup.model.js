import mongoose from "mongoose";

/**
 * ChatBackup Model
 * Stores metadata for chat backups and exports
 */
const chatBackupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Backup Type ───────────────────────────────────────────────────────────
    backupType: {
      type: String,
      enum: ["full", "conversation", "dateRange", "selective"],
      required: true,
    },

    // ── Backup Scope ──────────────────────────────────────────────────────────
    scope: {
      conversationIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "conversation",
        },
      ],
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      includeMedia: {
        type: Boolean,
        default: true,
      },
      includeDeleted: {
        type: Boolean,
        default: false,
      },
    },

    // ── Backup Status ─────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },

    // ── Progress Tracking ─────────────────────────────────────────────────────
    progress: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      processedMessages: {
        type: Number,
        default: 0,
      },
      totalSize: {
        type: Number, // in bytes
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },

    // ── Storage Information ───────────────────────────────────────────────────
    storage: {
      format: {
        type: String,
        enum: ["json", "pdf", "html", "csv"],
        default: "json",
      },
      location: {
        type: String, // File path or cloud URL
        default: null,
      },
      cloudProvider: {
        type: String,
        enum: ["local", "s3", "cloudinary", "drive"],
        default: "local",
      },
      fileSize: {
        type: Number, // in bytes
        default: 0,
      },
      fileName: {
        type: String,
        default: null,
      },
    },

    // ── Encryption ────────────────────────────────────────────────────────────
    isEncrypted: {
      type: Boolean,
      default: true,
    },
    encryptionKey: {
      type: String, // Encrypted with user's password
      default: null,
    },

    // ── Scheduling ────────────────────────────────────────────────────────────
    isScheduled: {
      type: Boolean,
      default: false,
    },
    schedule: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: null,
      },
      nextBackupAt: {
        type: Date,
        default: null,
      },
      lastBackupAt: {
        type: Date,
        default: null,
      },
    },

    // ── Metadata ──────────────────────────────────────────────────────────────
    messageCount: {
      type: Number,
      default: 0,
    },
    conversationCount: {
      type: Number,
      default: 0,
    },
    mediaCount: {
      type: Number,
      default: 0,
    },

    // ── Timestamps ────────────────────────────────────────────────────────────
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },

    // ── Error Tracking ────────────────────────────────────────────────────────
    error: {
      message: {
        type: String,
        default: null,
      },
      stack: {
        type: String,
        default: null,
      },
    },

    // ── Expiry ────────────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },

    // ── Download Tracking ─────────────────────────────────────────────────────
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
chatBackupSchema.index({ userId: 1, status: 1, createdAt: -1 });
chatBackupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
chatBackupSchema.index({ "schedule.nextBackupAt": 1 }, { sparse: true });

// ── Methods ───────────────────────────────────────────────────────────────────

/**
 * Mark backup as completed
 */
chatBackupSchema.methods.markCompleted = function (fileInfo) {
  this.status = "completed";
  this.completedAt = new Date();
  this.progress.percentage = 100;
  
  if (fileInfo) {
    this.storage.location = fileInfo.location;
    this.storage.fileSize = fileInfo.size;
    this.storage.fileName = fileInfo.fileName;
  }

  return this.save();
};

/**
 * Mark backup as failed
 */
chatBackupSchema.methods.markFailed = function (error) {
  this.status = "failed";
  this.failedAt = new Date();
  this.error.message = error.message;
  this.error.stack = error.stack;
  return this.save();
};

/**
 * Update progress
 */
chatBackupSchema.methods.updateProgress = function (processed, total) {
  this.progress.processedMessages = processed;
  this.progress.totalMessages = total;
  this.progress.percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  return this.save();
};

/**
 * Track download
 */
chatBackupSchema.methods.trackDownload = function () {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

// ── Static Methods ────────────────────────────────────────────────────────────

/**
 * Get pending scheduled backups
 */
chatBackupSchema.statics.getPendingScheduled = function () {
  return this.find({
    isScheduled: true,
    status: "pending",
    "schedule.nextBackupAt": { $lte: new Date() },
  });
};

/**
 * Clean up old backups
 */
chatBackupSchema.statics.cleanup = function () {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  return this.deleteMany({
    status: { $in: ["completed", "failed"] },
    createdAt: { $lt: cutoffDate },
  });
};

/**
 * Get user's backup history
 */
chatBackupSchema.statics.getUserBackups = function (userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-error.stack");
};

const ChatBackup = mongoose.model("ChatBackup", chatBackupSchema);

export default ChatBackup;
