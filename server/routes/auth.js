const express = require("express");
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout,
} = require("../controllers/authController");

const {
  protect,
  requireActive,
  checkAccountStatus,
} = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validation");

// Import for email check
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// ============================================================================
// EMAIL AVAILABILITY CHECK - Add this NEW route
// ============================================================================
router.post(
  "/check-email",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail()
      .trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          errors: errors.array(),
        });
      }

      const { email } = req.body;
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        return res.status(200).json({
          success: true,
          available: false,
          message: "This email is already registered",
        });
      }

      res.status(200).json({
        success: true,
        available: true,
        message: "Email is available",
      });
    } catch (error) {
      console.error("Email availability check error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while checking email availability",
      });
    }
  }
);

// ============================================================================
// EXISTING ROUTES (keep as is)
// ============================================================================

// Public routes - no authentication required
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/logout", logout);

// Basic protected routes - accessible to pending + active users
router.get("/me", protect, checkAccountStatus, getMe);

// Profile updates - basic info can be updated by pending users
router.put("/updatedetails", protect, updateDetails);

// Sensitive operations - require active account
router.put("/updatepassword", protect, requireActive, updatePassword);

module.exports = router;
