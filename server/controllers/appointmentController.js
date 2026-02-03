// server/controllers/appointmentController.js
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Application = require("../models/Application");
const zoomService = require("../services/zoomService");

/**
 * Create a new appointment request
 * @route POST /api/appointments
 * @access Private
 */
exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      doctorInviteeId,
      startTime,
      duration,
      timezone,
      purpose,
      notes,
      conversationId,
      applicationId, // NEW: Link to job application
    } = req.body;

    // Validation
    if (!doctorInviteeId || !startTime || !duration) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID, start time, and duration are required",
      });
    }

    // Prevent self-appointment
    if (userId.toString() === doctorInviteeId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot schedule appointment with yourself",
      });
    }

    // Verify invitee exists and is a doctor (junior or senior)
    const invitee = await User.findById(doctorInviteeId);
    if (!invitee) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Allow scheduling with both junior and senior doctors
    if (invitee.role !== "junior" && invitee.role !== "senior") {
      return res.status(400).json({
        success: false,
        message: "Can only schedule appointments with doctors",
      });
    }

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Validate start time is in future
    if (start <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Appointment must be scheduled in the future",
      });
    }

    // Check for conflicts for both doctors
    const initiatorConflict = await Appointment.checkConflict(
      userId,
      start,
      end
    );
    if (initiatorConflict) {
      return res.status(409).json({
        success: false,
        message: "You have a conflicting appointment at this time",
        conflict: initiatorConflict,
      });
    }

    const inviteeConflict = await Appointment.checkConflict(
      doctorInviteeId,
      start,
      end
    );
    if (inviteeConflict) {
      return res.status(409).json({
        success: false,
        message: "The doctor has a conflicting appointment at this time",
        conflict: inviteeConflict,
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      doctorInitiator: userId,
      doctorInvitee: doctorInviteeId,
      startTime: start,
      endTime: end,
      duration,
      timezone: timezone || "UTC",
      purpose,
      notes,
      conversationId,
      status: "pending",
    });

    await appointment.populate([
      {
        path: "doctorInitiator",
        select: "firstName lastName profilePhoto primarySpecialty",
      },
      {
        path: "doctorInvitee",
        select: "firstName lastName profilePhoto primarySpecialty",
      },
    ]);

    // Send message if conversation exists
    if (conversationId) {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await Message.create({
            conversationId,
            sender: userId,
            recipient: doctorInviteeId,
            content: `📅 Appointment request sent for ${start.toLocaleString()} (${duration} minutes)`,
            messageType: "appointment_request",
          });
        }
      } catch (msgError) {
        console.error("Error sending appointment message:", msgError);
      }
    }

    // Update application status if linked to an application
    if (applicationId) {
      try {
        const application = await Application.findById(applicationId);

        if (application) {
          // Update application status to interview_scheduled
          application.status = "interview_scheduled";
          application.appointmentId = appointment._id;
          application.interview_details = {
            scheduled_date: start,
            meeting_link: "", // Will be updated when appointment is confirmed
            notes: purpose || "",
          };
          await application.save();

            `✅ Application ${applicationId} status updated to interview_scheduled`
          );
        }
      } catch (appError) {
        console.error("Error updating application:", appError);
        // Don't fail the appointment creation if application update fails
      }
    }

    // Send notification to invitee about appointment request
    try {
      const notificationService = require("../utils/notificationService");
      await notificationService.sendNotification(
        doctorInviteeId,
        "appointment_request",
        {
          title: "Interview Scheduled",
          message: `Dr. ${req.user.firstName} ${
            req.user.lastName
          } scheduled an interview for ${start.toLocaleString()}`,
          data: {
            appointmentId: appointment._id,
            applicationId: applicationId || null,
          },
          actionUrl: "/appointments",
          priority: "high",
        }
      );
    } catch (notifError) {
      console.error("Error sending appointment notification:", notifError);
    }

    // Create or find conversation and send message
    try {
      let conversation;

      // Try to find existing conversation
      conversation = await Conversation.findOne({
        participants: { $all: [userId, doctorInviteeId] },
      });

      // If no conversation exists, create one
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [userId, doctorInviteeId],
          lastMessage: null,
        });
      }

      // Update appointment with conversation ID
      appointment.conversationId = conversation._id;
      await appointment.save();

      // Send appointment message
      await Message.create({
        conversationId: conversation._id,
        sender: userId,
        recipient: doctorInviteeId,
        content: `📅 Interview scheduled for ${start.toLocaleString()} (${duration} minutes)${
          purpose ? `\nPurpose: ${purpose}` : ""
        }${
          notes ? `\nNotes: ${notes}` : ""
        }\n\n⏳ Please confirm this appointment in your Appointments page.`,
        messageType: "appointment_request",
      });

      // Update conversation's last message
      conversation.lastMessage = `📅 Interview scheduled for ${start.toLocaleString()}`;
      conversation.updatedAt = new Date();
      await conversation.save();

    } catch (msgError) {
      console.error("Error sending appointment message:", msgError);
    }

    res.status(201).json({
      success: true,
      data: appointment,
      message: "Appointment request created successfully",
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
      error: error.message,
    });
  }
};

/**
 * Get all appointments for the authenticated user
 * @route GET /api/appointments
 * @access Private
 */
exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, upcoming, past } = req.query;

    const query = {
      $or: [{ doctorInitiator: userId }, { doctorInvitee: userId }],
    };

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.startTime = { $gt: new Date() };
      query.status = { $in: ["pending", "confirmed"] };
    }

    if (past === "true") {
      query.endTime = { $lt: new Date() };
    }

    const appointments = await Appointment.find(query)
      .sort({ startTime: upcoming === "true" ? 1 : -1 })
      .populate(
        "doctorInitiator doctorInvitee",
        "firstName lastName profilePhoto primarySpecialty"
      )
      .lean();

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
};

/**
 * Get a specific appointment
 * @route GET /api/appointments/:id
 * @access Private
 */
exports.getAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId).populate(
      "doctorInitiator doctorInvitee",
      "firstName lastName profilePhoto primarySpecialty"
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify user is a participant
    if (!appointment.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this appointment",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      error: error.message,
    });
  }
};

/**
 * Confirm an appointment and create Zoom meeting
 * @route PUT /api/appointments/:id/confirm
 * @access Private
 */
exports.confirmAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId).populate(
      "doctorInitiator doctorInvitee",
      "firstName lastName profilePhoto primarySpecialty"
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Only invitee can confirm
    if (appointment.doctorInvitee._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the invitee can confirm the appointment",
      });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Appointment is already ${appointment.status}`,
      });
    }

    // Check for conflicts again (in case of concurrent bookings)
    const conflict = await Appointment.checkConflict(
      userId,
      appointment.startTime,
      appointment.endTime,
      appointmentId
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "You have a conflicting appointment at this time",
        conflict,
      });
    }

    // Create Zoom meeting
    let zoomMeeting = null;
    if (zoomService.isConfigured()) {
      try {
        const topic = `Dr. ${appointment.doctorInitiator.firstName} ${appointment.doctorInitiator.lastName} & Dr. ${appointment.doctorInvitee.firstName} ${appointment.doctorInvitee.lastName}`;

        zoomMeeting = await zoomService.createMeeting({
          topic,
          startTime: appointment.startTime.toISOString(),
          duration: appointment.duration,
          timezone: appointment.timezone,
          agenda: appointment.purpose || "Medical consultation",
        });

        appointment.meetingId = zoomMeeting.meetingId;
        appointment.meetingJoinUrl = zoomMeeting.joinUrl;
        appointment.meetingStartUrl = zoomMeeting.startUrl;
        appointment.meetingPassword = zoomMeeting.password;
      } catch (zoomError) {
        console.error("Failed to create Zoom meeting:", zoomError);
        return res.status(500).json({
          success: false,
          message: "Failed to create Zoom meeting. Please try again.",
          error: zoomError.message,
        });
      }
    } else {
      console.warn(
        "⚠️  Zoom not configured, appointment confirmed without meeting link"
      );
    }

    appointment.status = "confirmed";
    await appointment.save();

    // Send confirmation message
    if (appointment.conversationId) {
      try {
        const messageContent = zoomMeeting
          ? `✅ Appointment confirmed!\n📅 ${appointment.startTime.toLocaleString()}\n🔗 Join Zoom Meeting: ${
              zoomMeeting.joinUrl
            }\n🔑 Password: ${zoomMeeting.password}`
          : `✅ Appointment confirmed for ${appointment.startTime.toLocaleString()}`;

        await Message.create({
          conversationId: appointment.conversationId,
          sender: userId,
          recipient: appointment.doctorInitiator._id,
          content: messageContent,
          messageType: "appointment_confirmed",
        });
      } catch (msgError) {
        console.error("Error sending confirmation message:", msgError);
      }
    }

    // Update application meeting link if linked
    if (appointment.conversationId && zoomMeeting) {
      try {
        const application = await Application.findOne({
          appointmentId: appointment._id,
        });
        if (application) {
          application.interview_details.meeting_link = zoomMeeting.joinUrl;
          await application.save();
        }
      } catch (appError) {
        console.error("Error updating application meeting link:", appError);
      }
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: "Appointment confirmed successfully",
    });
  } catch (error) {
    console.error("Error confirming appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm appointment",
      error: error.message,
    });
  }
};

/**
 * Cancel an appointment and delete Zoom meeting
 * @route PUT /api/appointments/:id/cancel
 * @access Private
 */
exports.cancelAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const appointmentId = req.params.id;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate(
      "doctorInitiator doctorInvitee",
      "firstName lastName profilePhoto primarySpecialty"
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify user is a participant
    if (!appointment.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this appointment",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed appointment",
      });
    }

    // Delete Zoom meeting if it exists
    if (appointment.meetingId && zoomService.isConfigured()) {
      try {
        await zoomService.deleteMeeting(appointment.meetingId);
      } catch (zoomError) {
        console.error("Failed to delete Zoom meeting:", zoomError);
        // Continue with cancellation even if Zoom deletion fails
      }
    }

    appointment.status = "cancelled";
    appointment.cancelledBy = userId;
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();
    await appointment.save();

    // Send cancellation message
    if (appointment.conversationId) {
      try {
        const otherParticipant = appointment.getOtherParticipant(userId);
        const messageContent = `❌ Appointment cancelled: ${appointment.startTime.toLocaleString()}${
          reason ? `\nReason: ${reason}` : ""
        }`;

        await Message.create({
          conversationId: appointment.conversationId,
          sender: userId,
          recipient: otherParticipant,
          content: messageContent,
          messageType: "appointment_cancelled",
        });
      } catch (msgError) {
        console.error("Error sending cancellation message:", msgError);
      }
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
};

/**
 * Mark appointment as completed
 * @route PUT /api/appointments/:id/complete
 * @access Private
 */
exports.completeAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify user is a participant
    if (!appointment.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this appointment",
      });
    }

    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed appointments can be marked as completed",
      });
    }

    appointment.status = "completed";
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment,
      message: "Appointment marked as completed",
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete appointment",
      error: error.message,
    });
  }
};

/**
 * Check doctor availability
 * @route GET /api/appointments/availability/:doctorId
 * @access Private
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      $or: [{ doctorInitiator: doctorId }, { doctorInvitee: doctorId }],
      status: { $in: ["pending", "confirmed"] },
      startTime: { $gte: startOfDay, $lte: endOfDay },
    }).select("startTime endTime");

    res.status(200).json({
      success: true,
      data: {
        bookedSlots: appointments.map((apt) => ({
          start: apt.startTime,
          end: apt.endTime,
        })),
      },
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check availability",
      error: error.message,
    });
  }
};

module.exports = exports;
