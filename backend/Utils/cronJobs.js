import cron from "node-cron";
import { cleanupOfflineQueue } from "../controller/offlineQueue.controller.js";
import { processScheduledBackups, cleanupOldBackups } from "../controller/chatBackup.controller.js";
import Message from "../models/message.model.js";
import MessageExtended from "../models/messageExtended.model.js";

/**
 * Start all cron jobs
 */
export const startCronJobs = () => {
  console.log("🕐 Starting cron jobs...");

  // ── Cleanup Offline Queue ─────────────────────────────────────────────────
  // Runs every day at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("🧹 Running offline queue cleanup...");
    try {
      await cleanupOfflineQueue();
    } catch (error) {
      console.error("Error in offline queue cleanup cron:", error);
    }
  });

  // ── Process Scheduled Backups ─────────────────────────────────────────────
  // Runs every hour
  cron.schedule("0 * * * *", async () => {
    console.log("📅 Checking for scheduled backups...");
    try {
      await processScheduledBackups();
    } catch (error) {
      console.error("Error in scheduled backups cron:", error);
    }
  });

  // ── Cleanup Old Backups ───────────────────────────────────────────────────
  // Runs every day at 3 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 Running backup cleanup...");
    try {
      await cleanupOldBackups();
    } catch (error) {
      console.error("Error in backup cleanup cron:", error);
    }
  });

  // ── Cleanup Expired Disappearing Messages ─────────────────────────────────
  // Runs every 15 minutes
  // Note: MongoDB TTL index handles this automatically, but we can also
  // manually delete messages and their extended data for immediate cleanup
  cron.schedule("*/15 * * * *", async () => {
    console.log("🧹 Cleaning up expired disappearing messages...");
    try {
      const now = new Date();

      // Find expired message extended records
      const expiredExtended = await MessageExtended.find({
        isDisappearing: true,
        expiresAt: { $lte: now },
      }).select("messageId");

      if (expiredExtended.length > 0) {
        const messageIds = expiredExtended.map((ext) => ext.messageId);

        // Delete the actual messages
        const deletedMessages = await Message.deleteMany({
          _id: { $in: messageIds },
        });

        // Delete extended data (TTL index will handle this, but we do it manually for consistency)
        const deletedExtended = await MessageExtended.deleteMany({
          messageId: { $in: messageIds },
        });

        console.log(
          `🗑️  Deleted ${deletedMessages.deletedCount} expired messages and ${deletedExtended.deletedCount} extended records`
        );
      } else {
        console.log("✅ No expired messages to clean up");
      }
    } catch (error) {
      console.error("Error in disappearing messages cleanup cron:", error);
    }
  });

  // ── Retry Failed Offline Queue Items ──────────────────────────────────────
  // Runs every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("🔄 Retrying failed offline queue items...");
    try {
      const OfflineQueue = (await import("../models/offlineQueue.model.js")).default;

      const now = new Date();
      const itemsToRetry = await OfflineQueue.find({
        status: "pending",
        nextRetryAt: { $lte: now },
        retryCount: { $lt: 3 },
      });

      if (itemsToRetry.length > 0) {
        console.log(`🔄 Found ${itemsToRetry.length} items to retry`);

        // Import processOfflineQueue dynamically to avoid circular dependency
        const { processOfflineQueue } = await import("../controller/offlineQueue.controller.js");

        // Group by userId
        const userIds = [...new Set(itemsToRetry.map((item) => item.userId.toString()))];

        for (const userId of userIds) {
          try {
            await processOfflineQueue(userId);
          } catch (error) {
            console.error(`Error retrying offline queue for user ${userId}:`, error);
          }
        }
      } else {
        console.log("✅ No items to retry");
      }
    } catch (error) {
      console.error("Error in retry failed queue items cron:", error);
    }
  });

  // ── Cleanup Old Notification Subscriptions ────────────────────────────────
  // Runs every week on Sunday at 4 AM
  cron.schedule("0 4 * * 0", async () => {
    console.log("🧹 Cleaning up old notification subscriptions...");
    try {
      const NotificationPreference = (await import("../models/notificationPreference.model.js"))
        .default;

      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

      const result = await NotificationPreference.updateMany(
        {},
        {
          $pull: {
            pushSubscriptions: {
              lastUsed: { $lt: cutoffDate },
            },
          },
        }
      );

      console.log(`🗑️  Cleaned up old notification subscriptions: ${result.modifiedCount} users affected`);
    } catch (error) {
      console.error("Error in notification subscriptions cleanup cron:", error);
    }
  });

  // ── Database Statistics & Health Check ────────────────────────────────────
  // Runs every day at 6 AM
  cron.schedule("0 6 * * *", async () => {
    console.log("📊 Generating database statistics...");
    try {
      const User = (await import("../models/user.model.js")).default;
      const Conversation = (await import("../models/conversation.model.js")).default;
      const OfflineQueue = (await import("../models/offlineQueue.model.js")).default;

      const stats = {
        totalUsers: await User.countDocuments(),
        totalMessages: await Message.countDocuments(),
        totalConversations: await Conversation.countDocuments(),
        pendingOfflineMessages: await OfflineQueue.countDocuments({ status: "pending" }),
        disappearingMessages: await MessageExtended.countDocuments({ isDisappearing: true }),
        timestamp: new Date().toISOString(),
      };

      console.log("📊 Database Statistics:", JSON.stringify(stats, null, 2));

      // You can send these stats to a monitoring service or store them
    } catch (error) {
      console.error("Error in database statistics cron:", error);
    }
  });

  console.log("✅ All cron jobs started successfully");
};

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export const stopCronJobs = () => {
  console.log("🛑 Stopping all cron jobs...");
  cron.getTasks().forEach((task) => task.stop());
  console.log("✅ All cron jobs stopped");
};
