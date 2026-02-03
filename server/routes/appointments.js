// server/routes/appointments.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const appointmentController = require("../controllers/appointmentController");

// All routes require authentication
router.use(protect);

// Appointment CRUD
router.post("/", appointmentController.createAppointment);
router.get("/", appointmentController.getAppointments);
router.get("/:id", appointmentController.getAppointment);

// Appointment actions
router.put("/:id/confirm", appointmentController.confirmAppointment);
router.put("/:id/cancel", appointmentController.cancelAppointment);
router.put("/:id/complete", appointmentController.completeAppointment);

// Availability checking
router.get("/availability/:doctorId", appointmentController.checkAvailability);

module.exports = router;
