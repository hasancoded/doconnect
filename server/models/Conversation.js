const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      content: {
        type: String,
        default: "",
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    relatedTo: {
      type: {
        type: String,
        enum: ["job", "application", "general"],
        default: "general",
      },
      referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate exactly 2 participants
conversationSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    next(new Error("Conversation must have exactly 2 participants"));
  }
  next();
});

// Compound index for finding conversations by participants
conversationSchema.index({ participants: 1 });

// Index for sorting by last message timestamp
conversationSchema.index({ "lastMessage.timestamp": -1 });

// Method to get the other participant in the conversation
conversationSchema.methods.getOtherParticipant = function (userId) {
  return this.participants.find(
    (participantId) => participantId.toString() !== userId.toString()
  );
};

// Method to check if user is a participant
conversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some(
    (participantId) => participantId.toString() === userId.toString()
  );
};

// Method to get unread count for a specific user
conversationSchema.methods.getUnreadCount = function (userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnreadCount = function (userId) {
  const userIdStr = userId.toString();
  const currentCount = this.unreadCount.get(userIdStr) || 0;
  this.unreadCount.set(userIdStr, currentCount + 1);
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnreadCount = function (userId) {
  this.unreadCount.set(userId.toString(), 0);
};

// Method to check if conversation is archived for a user
conversationSchema.methods.isArchivedFor = function (userId) {
  return this.archivedBy.some((id) => id.toString() === userId.toString());
};

// Method to check if conversation is muted for a user
conversationSchema.methods.isMutedFor = function (userId) {
  return this.mutedBy.some((id) => id.toString() === userId.toString());
};

// Static method to find conversation between two users
conversationSchema.statics.findBetweenUsers = async function (
  userId1,
  userId2
) {
  return this.findOne({
    participants: { $all: [userId1, userId2] },
  });
};

module.exports = mongoose.model("Conversation", conversationSchema);
