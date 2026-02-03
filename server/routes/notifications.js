const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

// All routes require authentication
router.use(protect);

// Notification routes
router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

// Notification preferences routes
router.get("/preferences", notificationController.getPreferences);
router.put("/preferences", notificationController.updatePreferences);

module.exports = router;
