import express from "express";
import secureRoute from "../middleware/secureRoute.js";
import {
  searchMessages,
  searchInConversation,
  searchUsers,
  getSearchSuggestions,
  advancedSearch,
} from "../controller/chatSearch.controller.js";

const router = express.Router();

// Search messages across all conversations
router.get("/messages", secureRoute, searchMessages);

// Search within specific conversation
router.get("/conversation/:conversationId", secureRoute, searchInConversation);

// Search users/contacts
router.get("/users", secureRoute, searchUsers);

// Get search suggestions
router.get("/suggestions", secureRoute, getSearchSuggestions);

// Advanced search with filters
router.post("/advanced", secureRoute, advancedSearch);

export default router;
