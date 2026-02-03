const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Get notifications for the authenticated user
 * @route GET /api/notifications
 * @access Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter options
    const { type, read, priority } = req.query;
    const filter = { recipient: userId };

    if (type) filter.type = type;
    if (read !== undefined) filter.read = read === "true";
    if (priority) filter.priority = priority;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 * @access Private
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

/**
 * Mark a notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Verify notification belongs to user
    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this notification",
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/mark-all-read
 * @access Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await Notification.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Verify notification belongs to user
    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this notification",
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

/**
 * Get notification preferences
 * @route GET /api/notifications/preferences
 * @access Private
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("notificationPreferences");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user.notificationPreferences || {
        email: {
          newMessage: true,
          jobApplication: true,
          applicationStatus: true,
          jobMatch: true,
          profileView: false,
          reviewReceived: true,
          weeklyDigest: true,
        },
        push: {
          newMessage: true,
          jobApplication: true,
          applicationStatus: true,
          jobMatch: true,
          highPriority: true,
        },
        inApp: {
          all: true,
          sound: true,
          desktop: false,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification preferences",
      error: error.message,
    });
  }
};

/**
 * Update notification preferences
 * @route PUT /api/notifications/preferences
 * @access Private
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { email, push, inApp } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update preferences
    if (email) {
      user.notificationPreferences.email = {
        ...user.notificationPreferences.email,
        ...email,
      };
    }

    if (push) {
      user.notificationPreferences.push = {
        ...user.notificationPreferences.push,
        ...push,
      };
    }

    if (inApp) {
      user.notificationPreferences.inApp = {
        ...user.notificationPreferences.inApp,
        ...inApp,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.notificationPreferences,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification preferences",
      error: error.message,
    });
  }
};
