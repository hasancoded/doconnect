const Notification = require("../models/Notification");

// This will be set when server initializes
let io = null;

/**
 * Set Socket.io instance
 * @param {SocketIO.Server} socketIo - Socket.io server instance
 */
const setSocketIO = (socketIo) => {
  io = socketIo;
};

/**
 * Create a notification in the database
 * @param {String} userId - Recipient user ID
 * @param {String} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Promise<Notification>} Created notification
 */
const createNotification = async (userId, type, data) => {
  try {
    const notification = await Notification.create({
      recipient: userId,
      type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      actionUrl: data.actionUrl,
      priority: data.priority || "medium",
      expiresAt: data.expiresAt,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Emit notification via Socket.io
 * @param {String} userId - Recipient user ID
 * @param {Object} notification - Notification object
 */
const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit("new_notification", notification);
  }
};

/**
 * Create and emit notification
 * @param {String} userId - Recipient user ID
 * @param {String} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Promise<Notification>} Created notification
 */
const sendNotification = async (userId, type, data) => {
  try {
    const notification = await createNotification(userId, type, data);
    emitNotification(userId, notification);
    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

/**
 * Send bulk notifications to multiple users
 * @param {Array<String>} userIds - Array of user IDs
 * @param {String} type - Notification type
 * @param {Object} data - Notification data
 */
const sendBulkNotifications = async (userIds, type, data) => {
  try {
    const notifications = await Promise.all(
      userIds.map((userId) => sendNotification(userId, type, data))
    );
    return notifications;
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    throw error;
  }
};

/**
 * Notify senior doctor about new job application
 * @param {String} seniorDoctorId - Senior doctor user ID
 * @param {Object} application - Application object
 * @param {Object} job - Job object
 * @param {Object} applicant - Applicant user object
 */
const notifyJobApplication = async (
  seniorDoctorId,
  application,
  job,
  applicant
) => {
  return sendNotification(seniorDoctorId, "job_application", {
    title: "New Job Application",
    message: `Dr. ${applicant.firstName} ${applicant.lastName} applied for "${job.title}"`,
    data: {
      applicationId: application._id,
      jobId: job._id,
      applicantId: applicant._id,
    },
    actionUrl: `/applications/${application._id}`,
    priority: "high",
  });
};

/**
 * Notify junior doctor about application status change
 * @param {String} juniorDoctorId - Junior doctor user ID
 * @param {Object} application - Application object
 * @param {String} status - New status
 * @param {Object} job - Job object
 */
const notifyApplicationStatus = async (
  juniorDoctorId,
  application,
  status,
  job
) => {
  const statusMessages = {
    accepted: `Your application for "${job.title}" has been accepted!`,
    rejected: `Your application for "${job.title}" was not accepted.`,
    shortlisted: `You've been shortlisted for "${job.title}"`,
    interviewing: `Interview scheduled for "${job.title}"`,
  };

  return sendNotification(juniorDoctorId, "application_status", {
    title: "Application Status Update",
    message:
      statusMessages[status] || `Application status updated to ${status}`,
    data: {
      applicationId: application._id,
      jobId: job._id,
      status,
    },
    actionUrl: `/applications/${application._id}`,
    priority: status === "accepted" ? "high" : "medium",
  });
};

/**
 * Notify junior doctor about job match
 * @param {String} juniorDoctorId - Junior doctor user ID
 * @param {Object} job - Matched job object
 * @param {Number} matchScore - Match score (0-100)
 */
const notifyJobMatch = async (juniorDoctorId, job, matchScore) => {
  return sendNotification(juniorDoctorId, "job_match", {
    title: "New Job Match",
    message: `We found a ${matchScore}% match: "${job.title}"`,
    data: {
      jobId: job._id,
      matchScore,
    },
    actionUrl: `/jobs/${job._id}`,
    priority: matchScore >= 80 ? "high" : "medium",
  });
};

/**
 * Notify user about profile view
 * @param {String} userId - User whose profile was viewed
 * @param {Object} viewer - User who viewed the profile
 */
const notifyProfileView = async (userId, viewer) => {
  return sendNotification(userId, "profile_view", {
    title: "Profile View",
    message: `Dr. ${viewer.firstName} ${viewer.lastName} viewed your profile`,
    data: {
      viewerId: viewer._id,
    },
    actionUrl: `/profile/${viewer._id}`,
    priority: "low",
  });
};

/**
 * Notify user about new review
 * @param {String} userId - User who received the review
 * @param {Object} reviewer - User who left the review
 * @param {Number} rating - Review rating
 */
const notifyReviewReceived = async (userId, reviewer, rating) => {
  return sendNotification(userId, "review_received", {
    title: "New Review",
    message: `Dr. ${reviewer.firstName} ${reviewer.lastName} left you a ${rating}-star review`,
    data: {
      reviewerId: reviewer._id,
      rating,
    },
    actionUrl: `/profile/${userId}#reviews`,
    priority: "medium",
  });
};

/**
 * Notify user about new message
 * @param {String} userId - Recipient user ID
 * @param {Object} sender - Sender user object
 * @param {String} messagePreview - Message preview text
 * @param {String} conversationId - Conversation ID
 */
const notifyNewMessage = async (
  userId,
  sender,
  messagePreview,
  conversationId
) => {
  return sendNotification(userId, "new_message", {
    title: "New Message",
    message: `Dr. ${sender.firstName} ${sender.lastName}: ${messagePreview}`,
    data: {
      senderId: sender._id,
      conversationId,
    },
    actionUrl: `/messages?conversation=${conversationId}`,
    priority: "high",
  });
};

/**
 * Notify user about subscription update
 * @param {String} userId - User ID
 * @param {String} message - Subscription update message
 * @param {String} plan - New plan name
 */
const notifySubscriptionUpdate = async (userId, message, plan) => {
  return sendNotification(userId, "subscription_update", {
    title: "Subscription Update",
    message,
    data: { plan },
    actionUrl: "/subscription",
    priority: "medium",
  });
};

/**
 * Notify user about verification status change
 * @param {String} userId - User ID
 * @param {String} verificationType - Type of verification (identity, medical_license, etc.)
 * @param {String} status - Verification status (verified, rejected)
 */
const notifyVerificationStatus = async (userId, verificationType, status) => {
  const messages = {
    verified: `Your ${verificationType.replace("_", " ")} has been verified!`,
    rejected: `Your ${verificationType.replace(
      "_",
      " "
    )} verification was rejected.`,
  };

  return sendNotification(userId, "verification_status", {
    title: "Verification Update",
    message: messages[status] || `Verification status updated`,
    data: {
      verificationType,
      status,
    },
    actionUrl: "/profile/verification",
    priority: "high",
  });
};

/**
 * Create application status notification (for status changes)
 * @param {String} applicantId - Applicant user ID
 * @param {String} jobId - Job ID
 * @param {String} applicationId - Application ID
 * @param {String} status - New status
 */
const createApplicationStatusNotification = async (
  applicantId,
  jobId,
  applicationId,
  status
) => {
  const Job = require("../models/Job");

  try {
    // Get job details for the notification message
    const job = await Job.findById(jobId).select("title");
    const jobTitle = job?.title || "a job";

    const statusMessages = {
      under_review: `Your application for "${jobTitle}" is now under review`,
      shortlisted: `Great news! You've been shortlisted for "${jobTitle}"`,
      interview_scheduled: `Interview scheduled for "${jobTitle}"! Check your appointments`,
      accepted: `Congratulations! Your application for "${jobTitle}" has been accepted!`,
      rejected: `Your application for "${jobTitle}" was not selected`,
      completed: `Your work on "${jobTitle}" has been marked as completed`,
    };

    const message =
      statusMessages[status] || `Application status updated to ${status}`;
    const priority = [
      "accepted",
      "interview_scheduled",
      "shortlisted",
    ].includes(status)
      ? "high"
      : "medium";

    return sendNotification(applicantId, "application_status", {
      title: "Application Status Update",
      message,
      data: {
        applicationId,
        jobId,
        status,
      },
      actionUrl: `/applications/tracking`,
      priority,
    });
  } catch (error) {
    console.error("Error creating application status notification:", error);
    throw error;
  }
};

module.exports = {
  setSocketIO,
  createNotification,
  emitNotification,
  sendNotification,
  sendBulkNotifications,
  notifyJobApplication,
  notifyApplicationStatus,
  notifyJobMatch,
  notifyProfileView,
  notifyReviewReceived,
  notifyNewMessage,
  notifySubscriptionUpdate,
  notifyVerificationStatus,
  createJobApplicationNotification: notifyJobApplication, // Alias for compatibility
  createApplicationStatusNotification, // NEW: For status change notifications
};
