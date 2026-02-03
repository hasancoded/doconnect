// config/cloudinary.js - Cloudinary configuration for file uploads
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

// Verify configuration on startup (optional)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
} else {
  console.warn("⚠️  Cloudinary credentials not found in environment variables");
  console.warn("   File upload features may not work properly");
}

module.exports = cloudinary;
