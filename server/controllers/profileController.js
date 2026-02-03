const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { validationResult } = require("express-validator");
const notificationService = require("../utils/notificationService");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "profilePhoto") {
      // Profile photos: only images
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Profile photo must be an image file"), false);
      }
    } else if (file.fieldname === "documents") {
      // Documents: images and PDFs
      if (
        file.mimetype.startsWith("image/") ||
        file.mimetype === "application/pdf"
      ) {
        cb(null, true);
      } else {
        cb(new Error("Documents must be image or PDF files"), false);
      }
    } else {
      cb(null, true);
    }
  },
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]);

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// @desc    Get current user's profile
// @route   GET /api/profile/me
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user.id)
      .populate("reviews.reviewer", "firstName lastName profilePhoto")
      .select("-password");


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Calculate and attach profile completion
      "Old profileCompletion:",
      JSON.stringify(user.profileCompletion, null, 2)
    );

    try {
      const profileCompletion = user.calculateProfileCompletion
        ? user.calculateProfileCompletion()
        : null;


      if (profileCompletion) {
        user.profileCompletion = profileCompletion;
        await user.save();
          "New profileCompletion:",
          JSON.stringify(user.profileCompletion, null, 2)
        );
      }
    } catch (err) {
      console.error("Failed to calculate profileCompletion:", err);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// @desc    Get public profile by slug or ID
// @route   GET /api/profile/:identifier
// @access  Public
exports.getPublicProfile = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if identifier is ObjectId or slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier };

    const user = await User.findOne({
      ...query,
      accountStatus: "active",
    })
      .populate(
        "reviews.reviewer",
        "firstName lastName profilePhoto verificationStatus"
      )
      .select(
        "-password -email -phone -loginAttempts -lockUntil -documents.url -subscription"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Check privacy settings
    if (user.privacy.profileVisibility === "private") {
      return res.status(403).json({
        success: false,
        message: "This profile is private",
      });
    }

    if (user.privacy.profileVisibility === "members_only" && !req.user) {
      return res.status(401).json({
        success: false,
        message: "Members only profile - please login to view",
      });
    }

    // Track profile view
    const viewerId = req.user ? req.user.id : null;
    const anonymousId = req.headers["x-anonymous-id"] || null;
    await user.addProfileView(viewerId, anonymousId);

    // Send notification to profile owner if viewed by logged-in user
    if (viewerId && viewerId !== user._id.toString()) {
      try {
        await notificationService.createProfileViewNotification(
          user._id,
          viewerId
        );
      } catch (notifError) {
        console.error("Error sending profile view notification:", notifError);
        // Don't fail the request if notification fails
      }
    }

    // Calculate real-time response time
    try {
      const responseTime = await user.calculateResponseTime();
      if (responseTime !== null) {
        user.job_statistics.response_time_hours = responseTime;
        await user.save({ validateBeforeSave: false });
      }
    } catch (responseError) {
      console.error("Error calculating response time:", responseError);
      // Don't fail the request if response time calculation fails
    }

    // Filter sensitive information based on privacy settings
    const publicProfile = user.toObject();
    if (!user.privacy.showEmail) {
      delete publicProfile.email;
    }
    if (!user.privacy.showPhone) {
      delete publicProfile.phone;
    }

    res.status(200).json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// @desc    Update profile basic information
// @route   PUT /api/profile/basic
// @access  Private
exports.updateBasicProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      bio,
      location,
      languages,
      subspecialties,
      preferences,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update basic fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (location) user.location = { ...user.location, ...location };
    if (languages) user.languages = languages;
    if (subspecialties) user.subspecialties = subspecialties;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating basic profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// @desc    Upload profile photo
// @route   POST /api/profile/photo
// @access  Private
exports.uploadProfilePhoto = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.files || !req.files.profilePhoto) {
        return res.status(400).json({
          success: false,
          message: "Please upload a profile photo",
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      try {
        // Delete old profile photo if exists
        if (user.profilePhoto && user.profilePhoto.publicId) {
          await cloudinary.uploader.destroy(user.profilePhoto.publicId);
        }

        // Upload new photo
        const file = req.files.profilePhoto[0];
        const result = await uploadToCloudinary(file.buffer, {
          folder: "doconnect/profile-photos",
          public_id: `profile_${user._id}`,
          transformation: [
            { width: 400, height: 400, crop: "fill", quality: "auto" },
            { format: "auto" },
          ],
        });

        user.profilePhoto = {
          url: result.secure_url,
          publicId: result.public_id,
        };

        await user.save();

        res.status(200).json({
          success: true,
          message: "Profile photo uploaded successfully",
          data: {
            profilePhoto: user.profilePhoto,
          },
        });
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Error uploading photo",
        });
      }
    });
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading photo",
    });
  }
};

// @desc    Upload documents
// @route   POST /api/profile/documents
// @access  Private
exports.uploadDocuments = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.files || !req.files.documents) {
        return res.status(400).json({
          success: false,
          message: "Please upload at least one document",
        });
      }

      const { documentTypes } = req.body;
      const files = req.files.documents;

      // Normalize documentTypes to array if it's a single string
      const types = Array.isArray(documentTypes)
        ? documentTypes
        : [documentTypes];

      if (!types || types.length !== files.length) {
        return res.status(400).json({
          success: false,
          message:
            "Document types must be specified for each file. Received " +
            (types ? types.length : 0) +
            " types for " +
            files.length +
            " files.",
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      try {
        const uploadPromises = files.map(async (file, index) => {
          const documentType = types[index];
          const isPdf = file.mimetype === "application/pdf";

          const result = await uploadToCloudinary(file.buffer, {
            folder: `doconnect/documents/${user._id}`,
            public_id: `${documentType}_${Date.now()}${isPdf ? ".pdf" : ""}`,
            resource_type: isPdf ? "raw" : "auto",
            type: "upload",
          });

            public_id: result.public_id,
            url: result.secure_url,
            format: result.format,
            resource_type: result.resource_type,
          });

          return {
            type: documentType,
            name: file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
            fileSize: file.size,
            mimeType: file.mimetype,
            verified: false,
          };
        });

        const uploadedDocuments = await Promise.all(uploadPromises);
        user.documents.push(...uploadedDocuments);
        await user.save();

        res.status(200).json({
          success: true,
          message: "Documents uploaded successfully",
          data: {
            documents: uploadedDocuments,
          },
        });
      } catch (uploadError) {
        console.error("Document upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Error uploading documents",
        });
      }
    });
  } catch (error) {
    console.error("Error uploading documents:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading documents",
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/profile/documents/:documentId
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const document = user.documents.id(req.params.documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(document.publicId);
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion error:", cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Remove from user documents
    user.documents.pull(document._id);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting document",
    });
  }
};

// @desc    Add experience
// @route   POST /api/profile/experience
// @access  Private
exports.addExperience = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newExperience = req.body;
    user.experiences.push(newExperience);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Experience added successfully",
      data: user.experiences[user.experiences.length - 1],
    });
  } catch (error) {
    console.error("Error adding experience:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding experience",
    });
  }
};

// @desc    Update experience
// @route   PUT /api/profile/experience/:experienceId
// @access  Private
exports.updateExperience = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const experience = user.experiences.id(req.params.experienceId);
    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    Object.assign(experience, req.body);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Experience updated successfully",
      data: experience,
    });
  } catch (error) {
    console.error("Error updating experience:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating experience",
    });
  }
};

// @desc    Delete experience
// @route   DELETE /api/profile/experience/:experienceId
// @access  Private
exports.deleteExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const experience = user.experiences.id(req.params.experienceId);
    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    user.experiences.pull(experience._id);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Experience deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting experience:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting experience",
    });
  }
};

// @desc    Add/Update skills
// @route   PUT /api/profile/skills
// @access  Private
exports.updateSkills = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { skills } = req.body;
    user.skills = skills;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Skills updated successfully",
      data: user.skills,
    });
  } catch (error) {
    console.error("Error updating skills:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating skills",
    });
  }
};

// @desc    Add certification
// @route   POST /api/profile/certifications
// @access  Private
exports.addCertification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newCertification = req.body;
    user.certifications.push(newCertification);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Certification added successfully",
      data: user.certifications[user.certifications.length - 1],
    });
  } catch (error) {
    console.error("Error adding certification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding certification",
    });
  }
};

// @desc    Update certification
// @route   PUT /api/profile/certifications/:certificationId
// @access  Private
exports.updateCertification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const certification = user.certifications.id(req.params.certificationId);
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    Object.assign(certification, req.body);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Certification updated successfully",
      data: certification,
    });
  } catch (error) {
    console.error("Error updating certification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating certification",
    });
  }
};

// @desc    Delete certification
// @route   DELETE /api/profile/certifications/:certificationId
// @access  Private
exports.deleteCertification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const certification = user.certifications.id(req.params.certificationId);
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    user.certifications.pull(certification._id);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Certification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting certification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting certification",
    });
  }
};

// @desc    Update availability
// @route   PUT /api/profile/availability
// @access  Private
exports.updateAvailability = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.availability = { ...user.availability, ...req.body };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data: user.availability,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating availability",
    });
  }
};

// @desc    Update privacy settings
// @route   PUT /api/profile/privacy
// @access  Private
exports.updatePrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.privacy = { ...user.privacy, ...req.body };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Privacy settings updated successfully",
      data: user.privacy,
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating privacy settings",
    });
  }
};

// @desc    Search doctor profiles
// @route   GET /api/profile/search
// @access  Public
exports.searchProfiles = async (req, res) => {
  try {
    const {
      q: searchTerm,
      primarySpecialty,
      experience,
      rating,
      location,
      verified,
      sortBy = "relevance",
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {
      primarySpecialty,
      experience: experience ? parseInt(experience) : undefined,
      rating: rating ? parseFloat(rating) : undefined,
      location,
      verified: verified === "true",
      sortBy,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    const query = User.searchDoctors(searchTerm, filters)
      .select("-password -email -phone -documents -loginAttempts -lockUntil")
      .populate("reviews.reviewer", "firstName lastName");

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const profiles = await query.skip(skip).limit(parseInt(limit)).lean();

    // Get total count for pagination
    const totalQuery = User.searchDoctors(searchTerm, filters);
    const total = await totalQuery.countDocuments();

    res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error searching profiles:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching profiles",
    });
  }
};

// @desc    Get profile analytics
// @route   GET /api/profile/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "analytics profileCompletion rating"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate additional metrics
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentViews = user.analytics.profileViews.filter(
      (view) => view.viewedAt > last30Days
    ).length;

    const analytics = {
      ...user.analytics.toObject(),
      recentViews,
      profileCompletion: user.profileCompletion,
      rating: user.rating,
      trend: {
        viewsGrowth:
          recentViews > user.analytics.views.thisMonth ? "up" : "down",
      },
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics",
    });
  }
};
