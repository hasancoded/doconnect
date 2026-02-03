// server/utils/messageQueue.js
/**
 * Message Queue for Offline Users
 * Stores and delivers messages when users come online
 */

const Message = require("../models/Message");

class MessageQueue {
  constructor() {
    // In-memory queue: userId -> messages[]
    this.queue = new Map();
    console.log("✅ Message queue initialized");
  }

  /**
   * Add message to queue for offline user
   * @param {String} userId - User ID
   * @param {Object} message - Message object
   */
  async queueMessage(userId, message) {
    try {
      // Add to in-memory queue
      if (!this.queue.has(userId.toString())) {
        this.queue.set(userId.toString(), []);
      }
      this.queue.get(userId.toString()).push(message);

      console.log(
        `📬 Queued message for offline user ${userId}: ${
          this.queue.get(userId.toString()).length
        } total`
      );

      // Persist to database with queued status
      if (message._id) {
        await Message.findByIdAndUpdate(message._id, {
          deliveryStatus: "queued",
        });
      }
    } catch (error) {
      console.error("Error queuing message:", error);
    }
  }

  /**
   * Deliver all queued messages when user comes online
   * @param {String} userId - User ID
   * @param {Socket} socket - Socket instance
   */
  async deliverQueuedMessages(userId, socket) {
    try {
      const userIdStr = userId.toString();
      const messages = this.queue.get(userIdStr) || [];

      if (messages.length === 0) {
        return;
      }

      console.log(
        `📨 Delivering ${messages.length} queued messages to user ${userId}`
      );

      // Deliver each message
      for (const msg of messages) {
        socket.emit("new_message", msg);
      }

      // Clear in-memory queue
      this.queue.delete(userIdStr);

      // Update delivery status in database
      await Message.updateMany(
        { recipient: userId, deliveryStatus: "queued" },
        {
          deliveryStatus: "delivered",
          deliveredAt: new Date(),
        }
      );

      console.log(`✅ Delivered ${messages.length} messages to user ${userId}`);
    } catch (error) {
      console.error("Error delivering queued messages:", error);
    }
  }

  /**
   * Get queue size for a user
   * @param {String} userId - User ID
   * @returns {Number} Number of queued messages
   */
  getQueueSize(userId) {
    return (this.queue.get(userId.toString()) || []).length;
  }

  /**
   * Clear queue for a user
   * @param {String} userId - User ID
   */
  clearQueue(userId) {
    this.queue.delete(userId.toString());
    console.log(`🗑️  Cleared message queue for user ${userId}`);
  }

  /**
   * Get total queued messages across all users
   * @returns {Number} Total queued messages
   */
  getTotalQueuedMessages() {
    let total = 0;
    for (const messages of this.queue.values()) {
      total += messages.length;
    }
    return total;
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue stats
   */
  getStats() {
    return {
      totalUsers: this.queue.size,
      totalMessages: this.getTotalQueuedMessages(),
      averagePerUser:
        this.queue.size > 0
          ? Math.round(this.getTotalQueuedMessages() / this.queue.size)
          : 0,
    };
  }
}

// Export singleton instance
module.exports = new MessageQueue();
