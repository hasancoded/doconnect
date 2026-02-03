// server/services/zoomService.js
const axios = require("axios");

/**
 * Zoom API Service
 * Handles Server-to-Server OAuth and meeting management
 */
class ZoomService {
  constructor() {
    this.accountId = process.env.ZOOM_ACCOUNT_ID;
    this.clientId = process.env.ZOOM_CLIENT_ID;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
    this.baseUrl = "https://api.zoom.us/v2";

    // Token cache
    this.accessToken = null;
    this.tokenExpiry = null;

    // Validate credentials on initialization
    if (!this.accountId || !this.clientId || !this.clientSecret) {
      console.warn(
        "⚠️  Zoom credentials not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in .env"
      );
    }
  }

  /**
   * Get access token using Server-to-Server OAuth
   * Tokens are cached and refreshed automatically
   */
  async getAccessToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry - 300000
    ) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString("base64");

      const response = await axios.post(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Zoom tokens expire in 1 hour
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      console.log("✅ Zoom access token obtained successfully");
      return this.accessToken;
    } catch (error) {
      console.error(
        "❌ Failed to get Zoom access token:",
        error.response?.data || error.message
      );
      throw new Error("Failed to authenticate with Zoom API");
    }
  }

  /**
   * Make authenticated request to Zoom API
   */
  async makeRequest(method, endpoint, data = null) {
    const token = await this.getAccessToken();

    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(
        `Zoom API Error (${method} ${endpoint}):`,
        error.response?.data || error.message
      );

      // Handle specific error codes
      if (error.response?.status === 401) {
        // Token expired, clear cache and retry once
        this.accessToken = null;
        this.tokenExpiry = null;

        if (!data?._retry) {
          return this.makeRequest(method, endpoint, { ...data, _retry: true });
        }
      }

      throw error;
    }
  }

  /**
   * Create a scheduled Zoom meeting
   * @param {Object} meetingData - Meeting configuration
   * @returns {Object} Meeting details including join URL
   */
  async createMeeting(meetingData) {
    const {
      topic,
      startTime, // ISO 8601 format
      duration, // in minutes
      timezone = "UTC",
      agenda = "",
    } = meetingData;

    const payload = {
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration,
      timezone,
      agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        watermark: false,
        use_pmi: false,
        approval_type: 2, // No registration required
        audio: "both", // Both telephony and VoIP
        auto_recording: "none",
        waiting_room: true, // Enable waiting room for security
        meeting_authentication: false, // No authentication required
        // Generate password automatically
        password: this.generatePassword(),
      },
    };

    try {
      const meeting = await this.makeRequest(
        "POST",
        "/users/me/meetings",
        payload
      );

      console.log(`✅ Zoom meeting created: ${meeting.id}`);

      return {
        meetingId: meeting.id.toString(),
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url,
        password: meeting.password,
        topic: meeting.topic,
        startTime: meeting.start_time,
        duration: meeting.duration,
      };
    } catch (error) {
      console.error(
        "Failed to create Zoom meeting:",
        error.response?.data || error.message
      );
      throw new Error("Failed to create Zoom meeting");
    }
  }

  /**
   * Update an existing Zoom meeting
   * @param {String} meetingId - Zoom meeting ID
   * @param {Object} updates - Fields to update
   */
  async updateMeeting(meetingId, updates) {
    const payload = {};

    if (updates.topic) payload.topic = updates.topic;
    if (updates.startTime) payload.start_time = updates.startTime;
    if (updates.duration) payload.duration = updates.duration;
    if (updates.timezone) payload.timezone = updates.timezone;
    if (updates.agenda) payload.agenda = updates.agenda;

    try {
      await this.makeRequest("PATCH", `/meetings/${meetingId}`, payload);
      console.log(`✅ Zoom meeting updated: ${meetingId}`);
      return true;
    } catch (error) {
      console.error(
        "Failed to update Zoom meeting:",
        error.response?.data || error.message
      );
      throw new Error("Failed to update Zoom meeting");
    }
  }

  /**
   * Delete a Zoom meeting
   * @param {String} meetingId - Zoom meeting ID
   */
  async deleteMeeting(meetingId) {
    try {
      await this.makeRequest("DELETE", `/meetings/${meetingId}`);
      console.log(`✅ Zoom meeting deleted: ${meetingId}`);
      return true;
    } catch (error) {
      // If meeting doesn't exist, consider it deleted
      if (error.response?.status === 404) {
        console.log(`Meeting ${meetingId} not found (already deleted)`);
        return true;
      }

      console.error(
        "Failed to delete Zoom meeting:",
        error.response?.data || error.message
      );
      throw new Error("Failed to delete Zoom meeting");
    }
  }

  /**
   * Get meeting details
   * @param {String} meetingId - Zoom meeting ID
   */
  async getMeeting(meetingId) {
    try {
      const meeting = await this.makeRequest("GET", `/meetings/${meetingId}`);
      return meeting;
    } catch (error) {
      console.error(
        "Failed to get Zoom meeting:",
        error.response?.data || error.message
      );
      throw new Error("Failed to get Zoom meeting details");
    }
  }

  /**
   * Generate a secure meeting password
   */
  generatePassword() {
    const chars =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Check if Zoom credentials are configured
   */
  isConfigured() {
    return !!(this.accountId && this.clientId && this.clientSecret);
  }
}

// Export singleton instance
module.exports = new ZoomService();
