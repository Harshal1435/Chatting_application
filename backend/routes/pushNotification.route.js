import express from "express";
import secureRoute from "../middleware/secureRoute.js";
import {
  subscribe,
  unsubscribe,
  updatePreferences,
  getPreferences,
  muteConversation,
  unmuteConversation,
  testNotification,
  getVapidPublicKey,
} from "../controller/pushNotification.controller.js";

const router = express.Router();

// Get VAPID public key (no auth required)
router.get("/vapid-public-key", getVapidPublicKey);

// Subscribe to push notifications
router.post("/subscribe", secureRoute, subscribe);

// Unsubscribe from push notifications
router.post("/unsubscribe", secureRoute, unsubscribe);

// Get notification preferences
router.get("/preferences", secureRoute, getPreferences);

// Update notification preferences
router.put("/preferences", secureRoute, updatePreferences);

// Mute conversation
router.post("/mute", secureRoute, muteConversation);

// Unmute conversation
router.post("/unmute", secureRoute, unmuteConversation);

// Test notification
router.post("/test", secureRoute, testNotification);

export default router;
