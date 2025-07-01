import {getCallHistory, getCallLog} from "../controller/call.controller.js";
import express from "express";
import secureRoute from "../middleware/secureRoute.js";
const router = express.Router();
// Route to get call history for a conversation
router.get("/history/:conversationId", secureRoute, getCallHistory);
// Route to log a new call
router.post("/log", secureRoute, getCallLog);
// Export the router
export default router;