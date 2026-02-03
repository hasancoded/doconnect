const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/auth");
const messageController = require("../controllers/messageController");

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and documents
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, PDFs, and documents are allowed."
        )
      );
    }
  },
});

// All routes require authentication
router.use(protect);

// Conversation routes
router.get("/conversations", messageController.getConversations);
router.get("/conversations/:id", messageController.getConversation);
router.post("/conversations", messageController.createConversation);
router.put("/conversations/:id/archive", messageController.archiveConversation);
router.put("/conversations/:id/mute", messageController.muteConversation);

// Message routes
router.get("/conversations/:id/messages", messageController.getMessages);
router.post("/conversations/:id/messages", messageController.sendMessage);
router.put("/conversations/:id/read", messageController.markConversationAsRead);
router.put("/mark-delivered", messageController.markMessagesAsDelivered);
router.put("/mark-read", messageController.markMessagesAsRead);
router.put("/:messageId", messageController.editMessage);
router.delete("/:messageId", messageController.deleteMessage);

// File upload route
router.post(
  "/upload",
  upload.single("file"),
  messageController.uploadMessageFile
);

module.exports = router;
