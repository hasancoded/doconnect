// server/models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    // Participants
    doctorInitiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctorInvitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Scheduling details
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
      default: "UTC",
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },

    // Status management
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },

    // Zoom meeting details
    meetingProvider: {
      type: String,
      default: "zoom",
      enum: ["zoom"],
    },
    meetingId: {
      type: String,
      sparse: true, // Only set when confirmed
    },
    meetingJoinUrl: {
      type: String,
    },
    meetingStartUrl: {
      type: String, // For host only
    },
    meetingPassword: {
      type: String,
    },

    // Additional details
    purpose: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Related conversation (for messaging integration)
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },

    // Cancellation details
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: {
      type: String,
      maxlength: 500,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
appointmentSchema.index({ doctorInitiator: 1, startTime: 1 });
appointmentSchema.index({ doctorInvitee: 1, startTime: 1 });
appointmentSchema.index({ status: 1, startTime: 1 });
appointmentSchema.index({ startTime: 1, endTime: 1 });

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual("isUpcoming").get(function () {
  return this.startTime > new Date() && this.status === "confirmed";
});

// Virtual for checking if appointment is past
appointmentSchema.virtual("isPast").get(function () {
  return this.endTime < new Date();
});

// Virtual for time until appointment
appointmentSchema.virtual("timeUntilStart").get(function () {
  return this.startTime - new Date();
});

// Instance method to check if user is participant
appointmentSchema.methods.isParticipant = function (userId) {
  return (
    this.doctorInitiator.toString() === userId.toString() ||
    this.doctorInvitee.toString() === userId.toString()
  );
};

// Instance method to get other participant
appointmentSchema.methods.getOtherParticipant = function (userId) {
  if (this.doctorInitiator.toString() === userId.toString()) {
    return this.doctorInvitee;
  }
  return this.doctorInitiator;
};

// Instance method to check if user is initiator
appointmentSchema.methods.isInitiator = function (userId) {
  return this.doctorInitiator.toString() === userId.toString();
};

// Static method to check for conflicts
appointmentSchema.statics.checkConflict = async function (
  doctorId,
  startTime,
  endTime,
  excludeAppointmentId = null
) {
  const query = {
    $or: [{ doctorInitiator: doctorId }, { doctorInvitee: doctorId }],
    status: { $in: ["pending", "confirmed"] },
    $or: [
      // New appointment starts during existing appointment
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // New appointment ends during existing appointment
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // New appointment completely contains existing appointment
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ],
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  return await this.findOne(query);
};

// Static method to get upcoming appointments for a doctor
appointmentSchema.statics.getUpcoming = async function (doctorId, limit = 10) {
  return await this.find({
    $or: [{ doctorInitiator: doctorId }, { doctorInvitee: doctorId }],
    status: "confirmed",
    startTime: { $gt: new Date() },
  })
    .sort({ startTime: 1 })
    .limit(limit)
    .populate(
      "doctorInitiator doctorInvitee",
      "firstName lastName profilePhoto primarySpecialty"
    );
};

// Static method to get pending appointments
appointmentSchema.statics.getPending = async function (doctorId) {
  return await this.find({
    doctorInvitee: doctorId,
    status: "pending",
  })
    .sort({ createdAt: -1 })
    .populate(
      "doctorInitiator",
      "firstName lastName profilePhoto primarySpecialty"
    );
};

// Pre-save middleware to calculate duration if not set
appointmentSchema.pre("save", function (next) {
  if (!this.duration && this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  next();
});

// Pre-save middleware to set endTime if duration is provided
appointmentSchema.pre("save", function (next) {
  if (this.duration && this.startTime && !this.endTime) {
    this.endTime = new Date(
      this.startTime.getTime() + this.duration * 60 * 1000
    );
  }
  next();
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
