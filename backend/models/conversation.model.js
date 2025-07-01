import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "./message.model.js";
import Call from "./call.model.js";
const conversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Message,
        default: [],
      },
    ],

    callHistory: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: Call,
    default: [],
  }
]

  },
  { timestamps: true }
);

const Conversation = mongoose.model("conversation", conversationSchema);
export default Conversation;
