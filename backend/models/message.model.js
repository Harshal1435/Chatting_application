import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    delivered: {
      type: Boolean,
      default: false, // set to true when receiver is online
    },
    seen: {
      type: Boolean,
      default: false, // set to true when receiver opens/reads it
    },

   iv: {
      type: String, // needed for AES decryption
      required: true,
    },
    
  },
  { timestamps: true }
);

const Message = mongoose.model("message", messageSchema);

export default Message;
