// server/controllers/applicationController.js - Complete Application Management
const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const notificationService = require("../utils/notificationService");

// @desc    Submit job application
// @route   POST /api/applications/submit
// @access  Private (Junior doctors only)
exports.submitApplication = async (req, res) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { job_id, proposal, applicant_notes, source = "search" } = req.body;

    // Verify user can apply to jobs
    if (req.user.role !== "junior") {
      return res.status(403).json({
        success: false,
        message: "Only junior doctors can apply to jobs",
      });
    }

    // Check if job exists and is active
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Job is not accepting applications",
      });
    }

    if (job.isExpired) {
      return res.status(400).json({
        success: false,
        message: "Job deadline has passed",
      });
    }

    // Check if user can apply to this job
    const eligibility = req.user.canApplyToJob(job);
    if (!eligibility.canApply) {
      return res.status(400).json({
        success: false,
        message: "Not eligible to apply",
        reasons: eligibility.reasons,
      });
    }

    // Check if user has already applied (exclude withdrawn applications)
    // First check for any existing application (including withdrawn)
    const anyExistingApplication = await Application.findOne({
      job_id,
      applicant_id: req.user.id,
    });

    // Check for active (non-withdrawn) application
    const activeApplication = await Application.findOne({
      job_id,
      applicant_id: req.user.id,
      status: { $ne: "withdrawn" },
    });

      job_id,
      applicant_id: req.user.id,
      anyExistingApplication: anyExistingApplication
        ? {
            _id: anyExistingApplication._id,
            status: anyExistingApplication.status,
          }
        : null,
      activeApplication: activeApplication
        ? { _id: activeApplication._id, status: activeApplication.status }
        : null,
    });

    // If there's an active (non-withdrawn) application, reject
    if (activeApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    let application;

    // If there's a withdrawn application, update it instead of creating new
    if (
      anyExistingApplication &&
      anyExistingApplication.status === "withdrawn"
    ) {
        "📝 Reactivating withdrawn application:",
        anyExistingApplication._id
      );

      // Update the existing withdrawn application with new data
      anyExistingApplication.proposal = proposal;
      anyExistingApplication.applicant_notes = applicant_notes;
      anyExistingApplication.status = "submitted";
      anyExistingApplication.source = source;
      anyExistingApplication.submitted_at = new Date();
      anyExistingApplication.communication_log.push({
        type: "status_change",
        content: "Application resubmitted after withdrawal",
        from: "applicant",
        date: new Date(),
      });

      await anyExistingApplication.save();
      application = anyExistingApplication;

    } else {
      // Create new application

      const applicationData = {
        job_id,
        applicant_id: req.user.id,
        proposal,
        applicant_notes,
        status: "submitted",
        source,
      };

      application = await Application.create(applicationData);
    }

    // Calculate match score
    await application.calculateMatchScore();

    // Update job analytics
    await job.updateApplicationsCount();
    await job.updateAnalytics();

    // Update user job statistics
    await req.user.updateJobStatistics();

    // Populate for response
    await application.populate([
      {
        path: "job_id",
        select: "title category specialty budget timeline posted_by",
      },
      {
        path: "applicant_id",
        select: "firstName lastName profilePhoto rating",
      },
    ]);

    // Send notification to job owner
    try {
      await notificationService.createJobApplicationNotification(
        job.posted_by,
        application, // Full application object
        job, // Full job object
        req.user // Full applicant user object
      );
    } catch (notifError) {
      console.error("Error sending application notification:", notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error submitting application:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while submitting application",
    });
  }
};

// @desc    Get user's applications
// @route   GET /api/applications/my-apps
// @access  Private (Junior doctors only)
exports.getMyApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = "createdAt",
      job_id,
    } = req.query;

    if (req.user.role !== "junior") {
      return res.status(403).json({
        success: false,
        message: "Only junior doctors can view applications",
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      job_id, // Pass job_id to filter by specific job
    };

    const applications = await Application.findByUser(req.user.id, options);

    // Get total count
    const query = { applicant_id: req.user.id };
    if (status) query.status = status;
    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting my applications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting applications",
    });
  }
};

// @desc    Get received applications (for employers)
// @route   GET /api/applications/received
// @access  Private (Senior doctors only)
exports.getReceivedApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      job_id,
      sortBy = "match_score",
    } = req.query;

    if (req.user.role !== "senior") {
      return res.status(403).json({
        success: false,
        message: "Only senior doctors can view received applications",
      });
    }

    // Get user's jobs
    const jobQuery = { posted_by: req.user.id };
    if (job_id) jobQuery._id = job_id;

    const userJobs = await Job.find(jobQuery).select("_id");
    const jobIds = userJobs.map((job) => job._id);

    if (jobIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 },
      });
    }

    // Build application query
    let query = { job_id: { $in: jobIds } };
    if (status) query.status = status;

    // Build sort options
    const sortOptions = {};
    if (sortBy === "match_score") {
      sortOptions.match_score = -1;
    } else if (sortBy === "budget") {
      sortOptions["proposal.proposed_budget"] = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate(
        "applicant_id",
        "firstName lastName profilePhoto rating verificationStatus"
      )
      .populate("job_id", "title category specialty")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter to employer view (remove sensitive applicant data)
    const filteredApplications = applications.map((app) => {
      delete app.applicant_notes;
      return app;
    });

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: filteredApplications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting received applications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting applications",
    });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Job owner only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, employer_notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const application = await Application.findById(req.params.id).populate(
      "job_id",
      "posted_by title"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify job ownership
    if (application.job_id.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this application",
      });
    }

    // Validate status transition
    const validTransitions = {
      submitted: ["under_review", "rejected"],
      under_review: ["shortlisted", "rejected"],
      shortlisted: ["interview_scheduled", "accepted", "rejected"],
      interview_scheduled: ["accepted", "rejected"],
      accepted: ["completed"],
    };

    const currentStatus = application.status;
    if (
      validTransitions[currentStatus] &&
      !validTransitions[currentStatus].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // Prevent manual interview_scheduled status (must be set via appointment)
    if (status === "interview_scheduled" && !req.body.fromAppointment) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot manually set status to interview_scheduled. Please schedule an appointment instead.",
      });
    }

    // Update application
    application.status = status;
    if (employer_notes) {
      application.employer_notes = employer_notes;
    }

    await application.save();

    // Add communication log entry
    await application.addCommunication(
      "status_change",
      `Application status changed to ${status}${
        employer_notes ? `. Notes: ${employer_notes}` : ""
      }`,
      "employer"
    );

    await application.populate(
      "applicant_id",
      "firstName lastName profilePhoto"
    );

    // Send notification to applicant about status change
    try {
      await notificationService.createApplicationStatusNotification(
        application.applicant_id._id,
        application.job_id._id,
        application._id,
        status
      );
    } catch (notifError) {
      console.error("Error sending status change notification:", notifError);
      // Don't fail the request if notification fails
    }

    // Send chat message about status change if conversation exists
    try {
      const Conversation = require("../models/Conversation");
      const Message = require("../models/Message");

      // Find conversation between employer and applicant
      const conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, application.applicant_id._id] },
      });

      if (conversation) {
        const statusMessages = {
          under_review: "📋 Your application is now under review",
          shortlisted: "🎯 Great news! Your application has been shortlisted",
          interview_scheduled:
            "📅 Interview scheduled! Check your appointments",
          accepted: "🎉 Congratulations! Your application has been accepted",
          rejected: "❌ Application status updated to rejected",
        };

        const messageContent =
          statusMessages[status] || `Application status changed to ${status}`;

        await Message.create({
          conversationId: conversation._id,
          sender: req.user.id,
          recipient: application.applicant_id._id,
          content: messageContent,
          messageType: "system",
        });
      }
    } catch (error) {
      console.error("Error sending status change message:", error);
    }

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating application",
    });
  }
};

// @desc    Withdraw application (supports both DELETE and PUT)
// @route   DELETE /api/applications/:id OR PUT /api/applications/:id/withdraw
// @access  Private (Applicant only)
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify ownership
    if (application.applicant_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to withdraw this application",
      });
    }

    // Check if application can be withdrawn
    if (["accepted", "completed", "withdrawn"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application in ${application.status} status`,
      });
    }

    // Update status to withdrawn
    application.status = "withdrawn";
    application.withdrawn_at = new Date();

    // Add to communication log
    await application.addCommunication(
      "status_change",
      "Application withdrawn by applicant",
      "applicant"
    );

    await application.save();

    // Update job application count
    const job = await Job.findById(application.job_id);
    if (job) {
      await job.updateApplicationsCount();
    }

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error withdrawing application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while withdrawing application",
    });
  }
};

// @desc    Send message to employer/applicant
// @route   POST /api/applications/:id/message
// @access  Private
exports.addMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const application = await Application.findById(req.params.id).populate(
      "job_id",
      "posted_by"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify user is either applicant or job owner
    const isApplicant = application.applicant_id.toString() === req.user.id;
    const isEmployer = application.job_id.posted_by.toString() === req.user.id;

    if (!isApplicant && !isEmployer) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to message on this application",
      });
    }

    // Add message to communication log
    const from = isEmployer ? "employer" : "applicant";
    await application.addCommunication("message", message.trim(), from);

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending message",
    });
  }
};

// @desc    Schedule interview
// @route   POST /api/applications/:id/interview
// @access  Private (Job owner only)
exports.scheduleInterview = async (req, res) => {
  try {
    const { date, time, platform, notes, scheduled_date, meeting_link } =
      req.body;

    // ✅ FIX: Support multiple date field names for compatibility
    const interviewDate = scheduled_date || date;

    if (!interviewDate) {
      return res.status(400).json({
        success: false,
        message: "Interview date is required",
      });
    }

    const application = await Application.findById(req.params.id).populate(
      "job_id",
      "posted_by title"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify job ownership
    if (application.job_id.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to schedule interview for this application",
      });
    }

    // ✅ FIX: Combine date and time if provided separately
    let finalDate = new Date(interviewDate);
    if (time && interviewDate) {
      const [hours, minutes] = time.split(":");
      finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    // Validate interview date is in the future
    if (finalDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Interview date must be in the future",
      });
    }

    // Update application
    application.interview_details = {
      scheduled_date: finalDate,
      meeting_link: meeting_link || platform || "", // ✅ FIX: Support both field names
      notes: notes || "",
      completed: false,
    };
    application.status = "interview_scheduled";

    await application.save();

    // Add communication log entry
    await application.addCommunication(
      "interview",
      `Interview scheduled for ${finalDate.toLocaleString()}`,
      "employer"
    );

    res.status(200).json({
      success: true,
      message: "Interview scheduled successfully",
      data: {
        interview_details: application.interview_details,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({
      success: false,
      message: "Server error while scheduling interview",
    });
  }
};

// @desc    Accept application (hire)
// @route   POST /api/applications/:id/accept
// @access  Private (Job owner only)
exports.acceptApplication = async (req, res) => {
  try {
    // ✅ FIX: Make contract_details optional with default value
    const { contract_details = {} } = req.body;

    const application = await Application.findById(req.params.id)
      .populate("job_id", "posted_by title")
      .populate("applicant_id", "firstName lastName email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify job ownership
    if (application.job_id.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this application",
      });
    }

    // Check if application can be accepted
    const validStatuses = [
      "under_review",
      "shortlisted",
      "interview_scheduled",
      "interview_completed",
    ];
    if (!validStatuses.includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot accept application in ${application.status} status`,
      });
    }

    // Update application
    application.status = "accepted";
    application.contract_details = {
      ...application.contract_details,
      ...contract_details,
      accepted_date: new Date(),
    };

    await application.save();

    // Close the job (mark as filled)
    const job = await Job.findById(application.job_id._id);
    if (job) {
      job.status = "closed";
      await job.save();
    }

    // Reject other pending applications for this job
    await Application.updateMany(
      {
        job_id: application.job_id._id,
        _id: { $ne: application._id },
        status: {
          $in: [
            "submitted",
            "under_review",
            "shortlisted",
            "interview_scheduled",
          ],
        },
      },
      {
        status: "rejected",
        $push: {
          communication_log: {
            type: "status_change",
            content: "Application rejected - position filled",
            from: "system",
            date: new Date(),
          },
        },
      }
    );

    // Add communication log entry
    await application.addCommunication(
      "status_change",
      "Application accepted - you've been hired!",
      "employer"
    );

    res.status(200).json({
      success: true,
      message: "Application accepted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error accepting application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while accepting application",
    });
  }
};

// @desc    Reject application
// @route   POST /api/applications/:id/reject
// @access  Private (Job owner only)
exports.rejectApplication = async (req, res) => {
  try {
    // ✅ FIX: Make rejection_reason optional
    const { rejection_reason } = req.body || {};

    const application = await Application.findById(req.params.id).populate(
      "job_id",
      "posted_by"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify job ownership
    if (application.job_id.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject this application",
      });
    }

    // Check if application can be rejected
    const validStatuses = [
      "submitted",
      "under_review",
      "shortlisted",
      "interview_scheduled",
      "interview_completed",
    ];
    if (!validStatuses.includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject application in ${application.status} status`,
      });
    }

    // Update application
    application.status = "rejected";
    if (rejection_reason) {
      application.employer_notes = rejection_reason;
    }

    await application.save();

    // Add communication log entry
    await application.addCommunication(
      "status_change",
      `Application rejected${rejection_reason ? `: ${rejection_reason}` : ""}`,
      "employer"
    );

    res.status(200).json({
      success: true,
      message: "Application rejected successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error rejecting application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while rejecting application",
    });
  }
};

// @desc    Get application details
// @route   GET /api/applications/:id
// @access  Private
exports.getApplicationDetails = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("job_id", "title category specialty budget timeline posted_by")
      .populate(
        "applicant_id",
        "firstName lastName profilePhoto rating verificationStatus"
      )
      .populate("job_id.posted_by", "firstName lastName profilePhoto");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify user can view this application
    const isApplicant = application.applicant_id._id.toString() === req.user.id;
    const isEmployer =
      application.job_id.posted_by._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isApplicant && !isEmployer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this application",
      });
    }

    // Filter data based on role
    let applicationData;
    if (isEmployer) {
      applicationData = application.getEmployerView();
    } else if (isApplicant) {
      applicationData = application.getApplicantView();
    } else {
      applicationData = application.toObject(); // Admin sees all
    }

    res.status(200).json({
      success: true,
      data: applicationData,
    });
  } catch (error) {
    console.error("Error getting application details:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting application details",
    });
  }
};

// @desc    Rate after project completion
// @route   POST /api/applications/:id/rate
// @access  Private
exports.rateApplication = async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const application = await Application.findById(req.params.id)
      .populate("job_id", "posted_by")
      .populate("applicant_id");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // ✅ FIX: Allow rating for accepted applications too (not just completed)
    if (!["accepted", "completed"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "Can only rate accepted or completed projects",
      });
    }

    // Check if user is employer or applicant
    const isEmployer = application.job_id.posted_by.toString() === req.user.id;
    const isApplicant = application.applicant_id._id.toString() === req.user.id;

    if (!isEmployer && !isApplicant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to rate this application",
      });
    }

    // Update feedback
    if (isEmployer) {
      if (application.feedback.employer_rating) {
        return res.status(400).json({
          success: false,
          message: "You have already rated this applicant",
        });
      }
      application.feedback.employer_rating = rating;
      application.feedback.employer_review = review || "";

      // Update applicant's rating
      const applicant = application.applicant_id;
      applicant.reviews = applicant.reviews || [];
      applicant.reviews.push({
        reviewer: req.user.id,
        project: application._id,
        rating,
        title: `Project: ${application.job_id.title}`,
        comment: review || "No review provided",
        categories: {
          communication: rating,
          expertise: rating,
          reliability: rating,
          professionalism: rating,
        },
        verified: true,
      });

      // Update applicant's overall rating
      if (applicant.updateRating) {
        applicant.updateRating();
      }
      await applicant.save();
    } else {
      if (application.feedback.applicant_rating) {
        return res.status(400).json({
          success: false,
          message: "You have already rated this employer",
        });
      }
      application.feedback.applicant_rating = rating;
      application.feedback.applicant_review = review || "";
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      data: {
        feedback: application.feedback,
      },
    });
  } catch (error) {
    console.error("Error rating application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while rating application",
    });
  }
};
