// utils/cloudinary.js

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ✅ Upload file to Cloudinary
export const uploadToCloudinary = async (filePath, folder = "status_uploads") => {
  try {
    if (!filePath) throw new Error("File path is required for Cloudinary upload");

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      folder,
    });

    // ✅ Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Always cleanup
    throw error;
  }
};

// ✅ Delete file from Cloudinary via public URL
export const deleteFromCloudinary = async (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl) return;

    const urlObj = new URL(cloudinaryUrl);
    const pathParts = urlObj.pathname.split("/");

    const folderIndex = pathParts.indexOf("status_uploads");
    if (folderIndex === -1) return;

    const publicIdWithExt = pathParts.slice(folderIndex + 1).join("/");
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // Remove extension

    await cloudinary.uploader.destroy(`status_uploads/${publicId}`, {
      resource_type: "auto",
    });
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error.message);
  }
};
