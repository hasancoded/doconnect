const User = require("../models/User");
const { validationResult } = require("express-validator");
const crypto = require("crypto");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      // Basic Information
      firstName,
      lastName,
      email,
      phone,
      password,
      role,

      // Medical Credentials
      medicalLicenseNumber,
      licenseState,
      primarySpecialty,
      subspecialties,
      yearsOfExperience,

      // Medical School Information
      medicalSchool,

      // Location Information
      location,

      // Languages
      languages,

      // Professional Bio
      bio,

      // Privacy Preferences
      privacy,
    } = req.body;

    // Enhanced validation
    const validationErrors = [];

    // Validate required basic fields
    if (!firstName?.trim())
      validationErrors.push({
        field: "firstName",
        message: "First name is required",
      });
    if (!lastName?.trim())
      validationErrors.push({
        field: "lastName",
        message: "Last name is required",
      });
    if (!email?.trim())
      validationErrors.push({ field: "email", message: "Email is required" });
    if (!phone?.trim())
      validationErrors.push({
        field: "phone",
        message: "Phone number is required",
      });
    if (!password)
      validationErrors.push({
        field: "password",
        message: "Password is required",
      });

    // Validate medical credentials
    if (!medicalLicenseNumber?.trim()) {
      validationErrors.push({
        field: "medicalLicenseNumber",
        message: "Medical license number is required",
      });
    }
    if (!licenseState?.trim()) {
      validationErrors.push({
        field: "licenseState",
        message: "License state is required",
      });
    }
    if (!primarySpecialty?.trim()) {
      validationErrors.push({
        field: "primarySpecialty",
        message: "Primary specialty is required",
      });
    }

    // Validate years of experience
    const experienceYears = parseInt(yearsOfExperience);
    if (isNaN(experienceYears) || experienceYears < 0 || experienceYears > 50) {
      validationErrors.push({
        field: "yearsOfExperience",
        message: "Years of experience must be between 0 and 50",
      });
    }

    // Validate medical school information
    if (!medicalSchool?.name?.trim()) {
      validationErrors.push({
        field: "medicalSchool.name",
        message: "Medical school name is required",
      });
    }

    const graduationYear = parseInt(medicalSchool?.graduationYear);
    const currentYear = new Date().getFullYear();
    if (
      isNaN(graduationYear) ||
      graduationYear < 1950 ||
      graduationYear > currentYear
    ) {
      validationErrors.push({
        field: "medicalSchool.graduationYear",
        message: `Graduation year must be between 1950 and ${currentYear}`,
      });
    }

    // Validate location
    if (!location?.city?.trim()) {
      validationErrors.push({
        field: "location.city",
        message: "City is required",
      });
    }
    if (!location?.state?.trim()) {
      validationErrors.push({
        field: "location.state",
        message: "State is required",
      });
    }

    // Validate languages array
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      validationErrors.push({
        field: "languages",
        message: "At least one language is required",
      });
    } else {
      const hasEmptyLanguage = languages.some((lang) => !lang.language?.trim());
      if (hasEmptyLanguage) {
        validationErrors.push({
          field: "languages",
          message: "All language entries must have a language specified",
        });
      }
    }

    // Validate subspecialties array if provided
    if (subspecialties && !Array.isArray(subspecialties)) {
      validationErrors.push({
        field: "subspecialties",
        message: "Subspecialties must be an array",
      });
    }

    // Validate bio length if provided
    if (bio && bio.length > 2000) {
      validationErrors.push({
        field: "bio",
        message: "Bio cannot exceed 2000 characters",
      });
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
        errors: [{ field: "email", message: "Email already in use" }],
      });
    }

    // Check if medical license number already exists
    const existingLicense = await User.findOne({ medicalLicenseNumber });
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: "Medical license number already registered",
        errors: [
          {
            field: "medicalLicenseNumber",
            message: "Medical license number already in use",
          },
        ],
      });
    }

    // Sanitize and prepare data for user creation
    const userData = {
      // Basic Information
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: role || "junior",

      // Medical Credentials
      medicalLicenseNumber: medicalLicenseNumber.trim(),
      licenseState: licenseState.trim(),
      primarySpecialty: primarySpecialty.trim(),
      subspecialties: Array.isArray(subspecialties)
        ? subspecialties
            .filter((spec) => spec?.trim())
            .map((spec) => spec.trim())
        : [],
      yearsOfExperience: experienceYears,

      // Medical School Information
      medicalSchool: {
        name: medicalSchool.name.trim(),
        graduationYear: graduationYear,
        location: medicalSchool.location?.trim() || "",
      },

      // Location Information
      location: {
        city: location.city.trim(),
        state: location.state.trim(),
        country: location.country?.trim() || "United States",
        timezone: location.timezone || "America/New_York",
      },

      // Languages (ensure at least English is included)
      languages: languages.map((lang) => ({
        language: lang.language.trim(),
        proficiency: lang.proficiency || "conversational",
      })),

      // Professional Bio
      bio: bio?.trim() || "",

      // Privacy Settings with secure defaults
      privacy: {
        profileVisibility: privacy?.profileVisibility || "members_only",
        showEmail: Boolean(privacy?.showEmail),
        showPhone: Boolean(privacy?.showPhone),
        allowDirectContact: privacy?.allowDirectContact !== false, // Default to true unless explicitly false
        showLastSeen: privacy?.showLastSeen !== false, // Default to true unless explicitly false
      },

      // Initialize account status and verification
      accountStatus: "pending",
      verificationStatus: {
        identity: "pending",
        medical_license: "pending",
        background_check: "pending",
        overall: "unverified",
      },
    };

    // Create user with enhanced data
    const user = await User.create(userData);

    // Calculate initial profile completion
    const completionPercentage = user.calculatedProfileCompletion;

    // Update profile completion tracking
    user.profileCompletion = {
      percentage: completionPercentage,
      completedSections: getCompletedSections(user),
      lastUpdated: new Date(),
    };
    await user.save({ validateBeforeSave: false });

    // Generate token and send enhanced response
    sendTokenResponse(user, 201, res, "Registration successful", {
      profileCompletion: user.profileCompletion,
      verificationStatus: user.verificationStatus,
      accountStatus: user.accountStatus,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const fieldMessages = {
        email: "Email address is already registered",
        medicalLicenseNumber: "Medical license number is already registered",
      };

      return res.status(400).json({
        success: false,
        message: fieldMessages[field] || "Duplicate field value",
        errors: [
          {
            field,
            message: fieldMessages[field] || "This field must be unique",
          },
        ],
      });
    }

    // Handle validation errors
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

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Helper function to determine completed profile sections
function getCompletedSections(user) {
  const sections = [];

  if (user.firstName && user.lastName && user.email && user.phone) {
    sections.push("basic_info");
  }

  if (
    user.medicalLicenseNumber &&
    user.primarySpecialty &&
    user.medicalSchool.name
  ) {
    sections.push("medical_info");
  }

  if (user.profilePhoto && user.profilePhoto.url) {
    sections.push("profile_photo");
  }

  if (user.bio && user.bio.length > 100) {
    sections.push("bio");
  }

  if (user.experiences && user.experiences.length > 0) {
    sections.push("experience");
  }

  if (user.skills && user.skills.length >= 3) {
    sections.push("skills");
  }

  if (user.certifications && user.certifications.length > 0) {
    sections.push("certifications");
  }

  if (user.documents && user.documents.length > 0) {
    sections.push("documents");
  }

  if (user.availability && user.availability.weeklySchedule) {
    sections.push("availability");
  }

  return sections;
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is suspended
    if (user.accountStatus === "suspended") {
      return res.status(401).json({
        success: false,
        message: "Account suspended. Please contact support.",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        user.accountStatus = "suspended";
      }

      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(401).json({
        success: false,
        message: "Account temporarily locked. Please try again later.",
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastActive = new Date();

    if (user.accountStatus === "pending") {
      user.accountStatus = "active";
    }

    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const allowedUpdates = [
      "firstName",
      "lastName",
      "bio",
      "primarySpecialty",
      "subspecialties",
      "phone",
      "location",
      "languages",
      "privacy",
    ];

    const fieldsToUpdate = {};

    // Only include allowed fields that are present in request
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    // Validate location if being updated
    if (fieldsToUpdate.location) {
      if (!fieldsToUpdate.location.city || !fieldsToUpdate.location.state) {
        return res.status(400).json({
          success: false,
          message: "City and state are required in location",
        });
      }
    }

    // Validate languages if being updated
    if (fieldsToUpdate.languages) {
      if (
        !Array.isArray(fieldsToUpdate.languages) ||
        fieldsToUpdate.languages.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one language is required",
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update details error:", error);

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
      message: "Server error",
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, "Password updated successfully");
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Update last active time
    if (req.user && req.user.id) {
      await User.findByIdAndUpdate(
        req.user.id,
        {
          lastActive: new Date(),
        },
        { validateBeforeSave: false },
      );
    }

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  }
};

// Enhanced helper function to get token from model, create cookie and send response
const sendTokenResponse = (
  user,
  statusCode,
  res,
  message,
  additionalData = {},
) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  // Prepare user data for response (excluding sensitive info)
  const userData = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    primarySpecialty: user.primarySpecialty,
    yearsOfExperience: user.yearsOfExperience,
    location: user.location,
    verificationStatus: user.verificationStatus,
    accountStatus: user.accountStatus,
    profileCompletion: user.profileCompletion,
    rating: user.rating,
    profilePhoto: user.profilePhoto,
    ...additionalData,
  };

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: userData,
  });
};
