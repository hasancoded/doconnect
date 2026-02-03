// server/utils/socketMonitor.js
/**
 * Socket.IO Monitoring and Statistics
 * Tracks connection health and performance metrics
 */

class SocketMonitor {
  constructor(io) {
    this.io = io;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      reconnections: 0,
      startTime: Date.now(),
    };

    this.setupMonitoring();
  }

  setupMonitoring() {
    // Note: Connection tracking is now handled in the unified socket handler
    // This class just provides methods to track stats

    // Log stats every 5 minutes
    this.statsInterval = setInterval(() => {
      this.logStats();
    }, 5 * 60 * 1000);

    console.log("✅ Socket.IO monitoring initialized");
  }

  // Method to be called when a socket connects
  trackConnection(socket) {
    this.stats.totalConnections++;
    this.stats.activeConnections++;

    console.log(
      `✅ Socket connected: ${socket.user?.fullName || "Unknown"} (${
        socket.id
      })`
    );
    console.log(`📊 Active connections: ${this.stats.activeConnections}`);
  }

  // Method to be called when a socket disconnects
  trackDisconnection(socket, reason) {
    this.stats.activeConnections--;
    console.log(
      `❌ Socket disconnected: ${
        socket.user?.fullName || "Unknown"
      } (${reason})`
    );
    console.log(`📊 Active connections: ${this.stats.activeConnections}`);
  }

  // Method to be called on socket error
  trackError(socket, error) {
    this.stats.errors++;
    console.error(`⚠️  Socket error for ${socket.id}:`, error.message);
  }

  // Method to be called on reconnection
  trackReconnection() {
    this.stats.reconnections++;
  }

  // Method to track messages
  trackMessage(eventName) {
    if (eventName.includes("send") || eventName.includes("message")) {
      this.stats.messagesSent++;
    }
    this.stats.messagesReceived++;
  }

  logStats() {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const uptimeMinutes = Math.floor(uptime / 60);

    console.log("\\n" + "=".repeat(50));
    console.log("📊 Socket.IO Statistics");
    console.log("=".repeat(50));
    console.log(`⏱️  Uptime: ${uptimeMinutes} minutes (${uptime}s)`);
    console.log(`👥 Active Connections: ${this.stats.activeConnections}`);
    console.log(`📈 Total Connections: ${this.stats.totalConnections}`);
    console.log(`📨 Messages Sent: ${this.stats.messagesSent}`);
    console.log(`📬 Messages Received: ${this.stats.messagesReceived}`);
    console.log(`🔄 Reconnections: ${this.stats.reconnections}`);
    console.log(`⚠️  Errors: ${this.stats.errors}`);
    console.log("=".repeat(50) + "\\n");
  }

  getStats() {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    return {
      ...this.stats,
      uptime,
      uptimeFormatted: `${Math.floor(uptime / 60)}m ${uptime % 60}s`,
    };
  }

  // Get current active connections count
  getActiveConnections() {
    return this.stats.activeConnections;
  }

  // Reset stats (useful for testing)
  resetStats() {
    this.stats = {
      totalConnections: 0,
      activeConnections: this.stats.activeConnections, // Keep current active
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      reconnections: 0,
      startTime: Date.now(),
    };
    console.log("📊 Socket.IO stats reset");
  }

  // Cleanup on shutdown
  cleanup() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    console.log("🛑 Socket.IO monitoring stopped");
  }
}

module.exports = SocketMonitor;
