// utils/encryption.js
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "myverystrongpasswordo32bitlength"; // 32 bytes
const IV_LENGTH = 16; // AES block size

export const encryptMessage = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
  };
};

export const decryptMessage = (encryptedData, iv) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
