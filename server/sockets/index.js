// server/sockets/index.js - Unified Socket.IO Handler
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Notification = require("../models/Notification");
const messageQueue = require("../utils/messageQueue");

/**
 * Initialize all socket handlers in a single connection handler
 * This prevents the "Invalid namespace" error from multiple io.on('connection') calls
 * @param {SocketIO.Server} io - Socket.io server instance
 * @param {SocketMonitor} socketMonitor - Socket monitor instance for tracking
 */
module.exports = (io, socketMonitor) => {
  // ========================================================================
  // ADMIN NAMESPACE - Real-Time Admin Dashboard
  // ========================================================================
  const adminSocketHandlers = require("./adminSocket")(io);

  // Export admin event emitters for use in other modules
  module.exports.adminEvents = adminSocketHandlers;

  // ========================================================================
  // MAIN NAMESPACE - User Messaging & Notifications
  // ========================================================================
  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(
      `✅ [CONNECTION] User connected: ${user.fullName} (${user._id})`
    );

    // Track connection in monitor
    if (socketMonitor) {
      socketMonitor.trackConnection(socket);
    }

    // Join user's personal room for targeted messages
    socket.join(`user:${user._id}`);

    // Deliver any queued messages from when user was offline
    messageQueue.deliverQueuedMessages(user._id, socket);

    // ========================================================================
    // MESSAGE HANDLERS
    // ========================================================================

    /**
     * Join a specific conversation room
     */
    socket.on("join_conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        // Verify user is a participant
        if (!conversation.isParticipant(user._id)) {
          socket.emit("error", {
            message: "Not authorized to join this conversation",
          });
          return;
        }

        // Join conversation room
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${user._id} joined conversation ${conversationId}`);

        // Mark messages as delivered first (if they were only sent)
        await Message.updateMany(
          {
            conversationId,
            recipient: user._id,
            status: "sent",
          },
          {
            status: "delivered",
            deliveredAt: new Date(),
          }
        );

        // Then mark messages as read
        const readResult = await Message.updateMany(
          {
            conversationId,
            recipient: user._id,
            status: { $in: ["sent", "delivered"] },
          },
          {
            status: "read",
            readAt: new Date(),
          }
        );

        // Reset unread count for this user
        conversation.resetUnreadCount(user._id);
        await conversation.save();

        // Notify other participant that messages were read
        const otherParticipantId = conversation.getOtherParticipant(user._id);
        if (readResult.modifiedCount > 0) {
          io.to(`user:${otherParticipantId}`).emit("messages_read", {
            conversationId,
            readBy: user._id,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    /**
     * Send a message
     */
    socket.on("send_message", async (data) => {
      try {
        const {
          conversationId,
          content,
          messageType,
          fileUrl,
          fileName,
          fileSize,
          replyTo,
        } = data;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        if (!conversation.isParticipant(user._id)) {
          socket.emit("error", {
            message: "Not authorized to send messages in this conversation",
          });
          return;
        }

        // Get recipient
        const recipientId = conversation.getOtherParticipant(user._id);

        // Create message
        const message = await Message.create({
          conversationId,
          sender: user._id,
          recipient: recipientId,
          content,
          messageType: messageType || "text",
          fileUrl,
          fileName,
          fileSize,
          replyTo,
        });

        await message.populate("sender", "firstName lastName profilePhoto");

        // Update conversation's last message
        conversation.lastMessage = {
          content: messageType === "file" ? `📎 ${fileName}` : content,
          sender: user._id,
          timestamp: new Date(),
        };

        // Increment unread count for recipient
        conversation.incrementUnreadCount(recipientId);
        await conversation.save();

        // Emit message to conversation room
        io.to(`conversation:${conversationId}`).emit("new_message", message);

        // Emit delivery receipt if recipient is online
        const recipientSockets = await io
          .in(`user:${recipientId}`)
          .fetchSockets();
        if (recipientSockets.length > 0) {
          // Recipient is online, mark as delivered
          message.status = "delivered";
          message.deliveredAt = new Date();
          await message.save();

          // Notify sender about delivery
          socket.emit("message_delivered", {
            messageId: message._id,
            conversationId,
            deliveredAt: message.deliveredAt,
          });
        }

        // Create and emit notification to recipient
        try {
          const notification = await Notification.create({
            recipient: recipientId,
            type: "new_message",
            title: "New Message",
            message: `${user.firstName} ${user.lastName} sent you a message`,
            priority: "high",
            data: {
              conversationId,
              messageId: message._id,
              senderId: user._id,
            },
          });

          // Emit notification event to recipient
          io.to(`user:${recipientId}`).emit("new_notification", notification);

          // Also emit message notification for real-time updates
          io.to(`user:${recipientId}`).emit("message_notification", {
            conversationId,
            message,
            sender: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePhoto: user.profilePhoto,
            },
          });
        } catch (notifError) {
          console.error("Error creating message notification:", notifError);
          // Don't fail the message send if notification fails
        }

        // Acknowledge to sender
        socket.emit("message_sent", {
          messageId: message._id,
          status: message.status,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    /**
     * Typing indicator - start
     */
    socket.on("typing_start", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation || !conversation.isParticipant(user._id)) {
          return;
        }

        const otherParticipantId = conversation.getOtherParticipant(user._id);

        io.to(`user:${otherParticipantId}`).emit("user_typing", {
          conversationId,
          userId: user._id,
          userName: user.fullName,
        });
      } catch (error) {
        console.error("Error broadcasting typing indicator:", error);
      }
    });

    /**
     * Typing indicator - stop
     */
    socket.on("typing_stop", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation || !conversation.isParticipant(user._id)) {
          return;
        }

        const otherParticipantId = conversation.getOtherParticipant(user._id);

        io.to(`user:${otherParticipantId}`).emit("user_stopped_typing", {
          conversationId,
          userId: user._id,
        });
      } catch (error) {
        console.error("Error broadcasting typing stop:", error);
      }
    });

    /**
     * Mark messages as delivered
     */
    socket.on("mark_as_delivered", async (data) => {
      try {
        const { messageIds, conversationId } = data;

        if (!messageIds || !Array.isArray(messageIds)) {
          return;
        }

        // Update messages to delivered status
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            recipient: user._id,
            status: "sent",
          },
          {
            status: "delivered",
            deliveredAt: new Date(),
          }
        );

        // Get the sender from the first message
        const firstMessage = await Message.findById(messageIds[0]);
        if (firstMessage) {
          // Notify sender
          io.to(`user:${firstMessage.sender}`).emit("messages_delivered", {
            messageIds,
            conversationId,
            deliveredAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error marking messages as delivered:", error);
      }
    });

    /**
     * Mark messages as read
     */
    socket.on("mark_as_read", async (data) => {
      try {
        const { messageIds, conversationId } = data;

        if (!messageIds || !Array.isArray(messageIds)) {
          return;
        }

        // Update messages to read status
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            recipient: user._id,
            status: { $in: ["sent", "delivered"] },
          },
          {
            status: "read",
            readAt: new Date(),
          }
        );

        // Update conversation unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.resetUnreadCount(user._id);
          await conversation.save();
        }

        // Get the sender from the first message
        const firstMessage = await Message.findById(messageIds[0]);
        if (firstMessage) {
          // Notify sender
          io.to(`user:${firstMessage.sender}`).emit("messages_read", {
            messageIds,
            conversationId,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    /**
     * Edit message
     */
    socket.on("edit_message", async (data) => {
      try {
        const { messageId, content } = data;

        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        if (message.sender.toString() !== user._id.toString()) {
          socket.emit("error", {
            message: "Not authorized to edit this message",
          });
          return;
        }

        if (message.messageType !== "text") {
          socket.emit("error", { message: "Only text messages can be edited" });
          return;
        }

        message.content = content;
        message.editedAt = new Date();
        await message.save();

        // Broadcast update to conversation room
        io.to(`conversation:${message.conversationId}`).emit("message_edited", {
          messageId,
          content,
          editedAt: message.editedAt,
        });
      } catch (error) {
        console.error("Error editing message:", error);
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    /**
     * Delete message
     */
    socket.on("delete_message", async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Add user to deletedBy array
        if (!message.deletedBy.includes(user._id)) {
          message.deletedBy.push(user._id);
          await message.save();
        }

        // Notify user
        socket.emit("message_deleted", { messageId });

        // If both users deleted, broadcast to conversation
        if (message.deletedBy.length === 2) {
          io.to(`conversation:${message.conversationId}`).emit(
            "message_deleted",
            { messageId }
          );
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // ========================================================================
    // NOTIFICATION HANDLERS
    // ========================================================================

    /**
     * Get notifications
     */
    socket.on("get_notifications", async (data) => {
      try {
        const { page = 1, limit = 20, type, read, priority } = data || {};
        const skip = (page - 1) * limit;

        const filter = { recipient: user._id };
        if (type) filter.type = type;
        if (read !== undefined) filter.read = read;
        if (priority) filter.priority = priority;

        const notifications = await Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const total = await Notification.countDocuments(filter);

        socket.emit("notifications_loaded", {
          notifications,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
        socket.emit("error", { message: "Failed to fetch notifications" });
      }
    });

    /**
     * Mark notification as read
     */
    socket.on("mark_notification_read", async (notificationId) => {
      try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
          socket.emit("error", { message: "Notification not found" });
          return;
        }

        if (notification.recipient.toString() !== user._id.toString()) {
          socket.emit("error", { message: "Not authorized" });
          return;
        }

        await notification.markAsRead();

        socket.emit("notification_marked_read", { notificationId });
      } catch (error) {
        console.error("Error marking notification as read:", error);
        socket.emit("error", {
          message: "Failed to mark notification as read",
        });
      }
    });

    /**
     * Mark all notifications as read
     */
    socket.on("mark_all_read", async () => {
      try {
        const result = await Notification.markAllAsRead(user._id);

        socket.emit("all_notifications_marked_read", {
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        socket.emit("error", {
          message: "Failed to mark all notifications as read",
        });
      }
    });

    /**
     * Delete notification
     */
    socket.on("delete_notification", async (notificationId) => {
      try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
          socket.emit("error", { message: "Notification not found" });
          return;
        }

        if (notification.recipient.toString() !== user._id.toString()) {
          socket.emit("error", { message: "Not authorized" });
          return;
        }

        await notification.deleteOne();

        socket.emit("notification_deleted", { notificationId });
      } catch (error) {
        console.error("Error deleting notification:", error);
        socket.emit("error", { message: "Failed to delete notification" });
      }
    });

    // ========================================================================
    // PRESENCE HANDLERS
    // ========================================================================

    /**
     * Update user status
     */
    socket.on("update_status", async (status) => {
      try {
        await User.findByIdAndUpdate(user._id, {
          "onlineStatus.status": status,
          "onlineStatus.lastSeen": new Date(),
        });

        // Broadcast status update to all connected users
        io.emit("user_status_changed", {
          userId: user._id,
          status,
          lastSeen: new Date(),
        });
      } catch (error) {
        console.error("Error updating user status:", error);
      }
    });

    /**
     * User activity tracking
     */
    socket.on("user_activity", async () => {
      try {
        await User.findByIdAndUpdate(user._id, {
          "onlineStatus.lastSeen": new Date(),
        });
      } catch (error) {
        console.error("Error updating user activity:", error);
      }
    });

    // Set user as online on connection
    User.findByIdAndUpdate(user._id, {
      "onlineStatus.status": "online",
      "onlineStatus.lastSeen": new Date(),
    })
      .then(() => {
        io.emit("user_status_changed", {
          userId: user._id,
          status: "online",
          lastSeen: new Date(),
        });
      })
      .catch((error) => {
        console.error("Error setting user online:", error);
      });

    // ========================================================================
    // DISCONNECT HANDLER
    // ========================================================================

    /**
     * Handle disconnect
     */
    socket.on("disconnect", async (reason) => {
      console.log(`User disconnected: ${user.fullName} (${user._id})`);

      // Track disconnection in monitor
      if (socketMonitor) {
        socketMonitor.trackDisconnection(socket, reason);
      }

      try {
        // Set user as offline
        await User.findByIdAndUpdate(user._id, {
          "onlineStatus.status": "offline",
          "onlineStatus.lastSeen": new Date(),
        });

        // Broadcast status update
        io.emit("user_status_changed", {
          userId: user._id,
          status: "offline",
          lastSeen: new Date(),
        });
      } catch (error) {
        console.error("Error setting user offline:", error);
      }
    });
  });
};

/**
 * Helper function to emit notification to a specific user
 * Can be called from anywhere in the application
 * @param {SocketIO.Server} io - Socket.io server instance
 * @param {String} userId - User ID to send notification to
 * @param {Object} notification - Notification object
 */
const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit("new_notification", notification);
};

module.exports.emitNotification = emitNotification;
