const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: function () {
        return this.messageType === "text" || this.messageType === "system";
      },
      maxlength: 5000,
    },
    messageType: {
      type: String,
      enum: ["text", "file", "system"],
      default: "text",
      required: true,
    },
    // File attachment fields
    fileUrl: {
      type: String,
      required: function () {
        return this.messageType === "file";
      },
    },
    fileName: {
      type: String,
      required: function () {
        return this.messageType === "file";
      },
    },
    fileSize: {
      type: Number,
      required: function () {
        return this.messageType === "file";
      },
    },
    // Message status fields
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    editedAt: {
      type: Date,
      default: null,
    },
    // Reply threading
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient conversation message queries
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Index for unread messages
messageSchema.index({ recipient: 1, readAt: 1 });

// Virtual for checking if message is deleted for a specific user
messageSchema.methods.isDeletedFor = function (userId) {
  return this.deletedBy.some((id) => id.toString() === userId.toString());
};

// Virtual for checking if message is read
messageSchema.virtual("isRead").get(function () {
  return this.readAt !== null;
});

// Ensure virtuals are included in JSON
messageSchema.set("toJSON", { virtuals: true });
messageSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Message", messageSchema);
