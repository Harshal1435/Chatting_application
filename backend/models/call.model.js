// models/call.model.js

import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ringing", "missed", "rejected", "ended", "accepted"], // ✅ Add "ringing"
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
  },
  { timestamps: true }
);

const Call = mongoose.model("Call", callSchema);

export default Call;
