// 📁 models/user.model.js
import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., "follow-request"
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  confirmPassword: { type: String },
  avatar: { type: String, default: "" },
  
  notifications: { type: [notificationSchema], default: [] },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" , default: [] }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: []  }],
  followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: []  }], // pending requests
  isPrivate: { type: Boolean, default: true },

  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  post: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" ,default: []}],
}, { timestamps: true });


const User = mongoose.model("User", userSchema);
export default User;
