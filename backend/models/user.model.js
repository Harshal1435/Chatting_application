// 📁 models/user.model.js
import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    confirmPassword: { type: String },
    avatar: { type: String, default: "" },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ add this
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
