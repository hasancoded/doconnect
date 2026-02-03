const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "new_message",
        "job_application",
        "application_status",
        "job_match",
        "profile_view",
        "review_received",
        "subscription_update",
        "verification_status",
        "system_announcement",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user notification queries
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Compound index for unread notifications
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Index for cleanup of expired notifications
notificationSchema.index({ expiresAt: 1 }, { sparse: true });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to delete expired notifications
notificationSchema.statics.deleteExpired = async function () {
  return this.deleteMany({
    expiresAt: { $ne: null, $lt: new Date() },
  });
};

// Virtual for checking if notification is expired
notificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Ensure virtuals are included in JSON
notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Notification", notificationSchema);
