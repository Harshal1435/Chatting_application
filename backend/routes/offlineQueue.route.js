import express from "express";
import secureRoute from "../middleware/secureRoute.js";
import {
  getOfflineQueueStatus,
  retryFailedMessages,
  clearDeliveredMessages,
  getPendingCount,
} from "../controller/offlineQueue.controller.js";

const router = express.Router();

// Get offline queue status
router.get("/status", secureRoute, getOfflineQueueStatus);

// Get pending messages count
router.get("/pending-count", secureRoute, getPendingCount);

// Retry failed messages
router.post("/retry", secureRoute, retryFailedMessages);

// Clear delivered messages
router.delete("/clear-delivered", secureRoute, clearDeliveredMessages);

export default router;
