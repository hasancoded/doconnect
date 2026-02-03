const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

/**
 * Get all conversations for the authenticated user
 * @route GET /api/messages/conversations
 * @access Private
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId },
    })
      .populate(
        "participants",
        "firstName lastName profilePhoto onlineStatus lastActive role primarySpecialty"
      )
      .sort({ "lastMessage.timestamp": -1 })
      .skip(skip)
      .limit(limit);

    const total = await Conversation.countDocuments({
      participants: userId,
      archivedBy: { $ne: userId },
    });

    // Transform conversations to include other participant info and unread count
    const transformedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: conv._id,
        otherParticipant,
        lastMessage: conv.lastMessage,
        unreadCount: conv.getUnreadCount(userId),
        isMuted: conv.isMutedFor(userId),
        relatedTo: conv.relatedTo,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: transformedConversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

/**
 * Get a specific conversation by ID
 * @route GET /api/messages/conversations/:id
 * @access Private
 */
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId).populate(
      "participants",
      "firstName lastName profilePhoto onlineStatus lastActive role primarySpecialty"
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Verify user is a participant
    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this conversation",
      });
    }

    const otherParticipant = conversation.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        _id: conversation._id,
        otherParticipant,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.getUnreadCount(userId),
        isMuted: conversation.isMutedFor(userId),
        isArchived: conversation.isArchivedFor(userId),
        relatedTo: conversation.relatedTo,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
      error: error.message,
    });
  }
};

/**
 * Get messages for a specific conversation
 * @route GET /api/messages/conversations/:id/messages
 * @access Private
 */
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view these messages",
      });
    }

    // Fetch messages (excluding those deleted by this user)
    const messages = await Message.find({
      conversationId,
      deletedBy: { $ne: userId },
    })
      .populate("sender", "firstName lastName profilePhoto")
      .populate("replyTo", "content sender")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      conversationId,
      deletedBy: { $ne: userId },
    });

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

/**
 * Create a new conversation
 * @route POST /api/messages/conversations
 * @access Private
 */
exports.createConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { participantId, relatedTo } = req.body;

    // Validate participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findBetweenUsers(
      userId,
      participantId
    );

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        data: existingConversation,
        message: "Conversation already exists",
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [userId, participantId],
      relatedTo: relatedTo || { type: "general" },
    });

    await conversation.populate(
      "participants",
      "firstName lastName profilePhoto onlineStatus lastActive role primarySpecialty"
    );

    res.status(201).json({
      success: true,
      data: conversation,
      message: "Conversation created successfully",
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

/**
 * Send a message (REST fallback for Socket.io)
 * @route POST /api/messages/conversations/:id/messages
 * @access Private
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;
    const { content, messageType, fileUrl, fileName, fileSize, replyTo } =
      req.body;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to send messages in this conversation",
      });
    }

    // Get recipient
    const recipientId = conversation.getOtherParticipant(userId);

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      recipient: recipientId,
      content,
      messageType: messageType || "text",
      fileUrl,
      fileName,
      fileSize,
      replyTo,
    });

    // Update conversation's last message
    conversation.lastMessage = {
      content: messageType === "file" ? `📎 ${fileName}` : content,
      sender: userId,
      timestamp: new Date(),
    };

    // Increment unread count for recipient
    conversation.incrementUnreadCount(recipientId);
    await conversation.save();

    await message.populate("sender", "firstName lastName profilePhoto");

    res.status(201).json({
      success: true,
      data: message,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * Mark messages as delivered
 * @route PUT /api/messages/mark-delivered
 * @access Private
 */
exports.markMessagesAsDelivered = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: "Message IDs array is required",
      });
    }

    // Update messages where user is recipient and status is 'sent'
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        recipient: userId,
        status: "sent",
      },
      {
        $set: {
          status: "delivered",
          deliveredAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
      message: "Messages marked as delivered",
    });
  } catch (error) {
    console.error("Error marking messages as delivered:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as delivered",
      error: error.message,
    });
  }
};

/**
 * Mark messages as read
 * @route PUT /api/messages/mark-read
 * @access Private
 */
exports.markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageIds, conversationId } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: "Message IDs array is required",
      });
    }

    // Update messages where user is recipient
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        recipient: userId,
        status: { $in: ["sent", "delivered"] },
      },
      {
        $set: {
          status: "read",
          readAt: new Date(),
        },
      }
    );

    // If conversationId provided, reset unread count
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (conversation && conversation.isParticipant(userId)) {
        conversation.resetUnreadCount(userId);
        await conversation.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

/**
 * Edit a message
 * @route PUT /api/messages/:messageId
 * @access Private
 */
exports.editMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const messageId = req.params.messageId;
    const { content } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    // Only allow editing text messages
    if (message.messageType !== "text") {
      return res.status(400).json({
        success: false,
        message: "Only text messages can be edited",
      });
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      data: message,
      message: "Message edited successfully",
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to edit message",
      error: error.message,
    });
  }
};

/**
 * Delete a message (soft delete)
 * @route DELETE /api/messages/:messageId
 * @access Private
 */
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Add user to deletedBy array if not already there
    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId);
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

/**
 * Archive a conversation
 * @route PUT /api/messages/conversations/:id/archive
 * @access Private
 */
exports.archiveConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to archive this conversation",
      });
    }

    // Toggle archive status
    const isArchived = conversation.isArchivedFor(userId);

    if (isArchived) {
      conversation.archivedBy = conversation.archivedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      conversation.archivedBy.push(userId);
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      data: { isArchived: !isArchived },
      message: isArchived ? "Conversation unarchived" : "Conversation archived",
    });
  } catch (error) {
    console.error("Error archiving conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to archive conversation",
      error: error.message,
    });
  }
};

/**
 * Mute a conversation
 * @route PUT /api/messages/conversations/:id/mute
 * @access Private
 */
exports.muteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to mute this conversation",
      });
    }

    // Toggle mute status
    const isMuted = conversation.isMutedFor(userId);

    if (isMuted) {
      conversation.mutedBy = conversation.mutedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      conversation.mutedBy.push(userId);
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      data: { isMuted: !isMuted },
      message: isMuted ? "Conversation unmuted" : "Conversation muted",
    });
  } catch (error) {
    console.error("Error muting conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mute conversation",
      error: error.message,
    });
  }
};

/**
 * Mark conversation as read
 * @route PUT /api/messages/conversations/:id/read
 * @access Private
 */
exports.markConversationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this conversation",
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        status: { $in: ["sent", "delivered"] },
      },
      {
        $set: {
          status: "read",
          readAt: new Date(),
        },
      }
    );

    // Reset unread count for this user
    conversation.resetUnreadCount(userId);
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark conversation as read",
      error: error.message,
    });
  }
};

/**
 * Upload file for message attachment
 * @route POST /api/messages/upload
 * @access Private
 */
exports.uploadMessageFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "docconnect/messages",
      resource_type: "auto",
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file",
      error: error.message,
    });
  }
};

module.exports = exports;
