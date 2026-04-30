import express from "express";
import secureRoute from "../middleware/secureRoute.js";
import {
  replyToMessage,
  forwardMessage,
  addReaction,
  removeReaction,
  createDisappearingMessage,
  editMessage,
  getMessageExtended,
  togglePinMessage,
} from "../controller/messageExtended.controller.js";

const router = express.Router();

// Reply to a message
router.post("/reply/:id", secureRoute, replyToMessage);

// Forward message to multiple users
router.post("/forward", secureRoute, forwardMessage);

// Add reaction to message
router.post("/reaction/add", secureRoute, addReaction);

// Remove reaction from message
router.post("/reaction/remove", secureRoute, removeReaction);

// Create disappearing message
router.post("/disappearing/:id", secureRoute, createDisappearingMessage);

// Edit message
router.put("/edit", secureRoute, editMessage);

// Get message extended data
router.get("/:messageId", secureRoute, getMessageExtended);

// Pin/unpin message
router.post("/pin", secureRoute, togglePinMessage);

export default router;
