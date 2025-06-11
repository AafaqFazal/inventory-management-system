const express = require("express");
const router = express.Router();
const departmentController = require("../controller/departmentController");
const multer = require("multer");
const path = require("path");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file to avoid conflicts
  },
});

const upload = multer({ storage: storage });

// Create a new student (with photo upload)
router.post("/", upload.single("photo"), departmentController.createMember);

// Get all students
router.get("/", departmentController.getAllMembers);

// Get a student by ID
router.get("/:id", departmentController.getMemberById);

// Update a student by ID (with photo upload)
router.put("/:id", upload.single("photo"), departmentController.updateMemberById);

// Delete a student by ID
router.delete("/:id", departmentController.deleteMemberById);

// Attendance functionality routes
router.post("/:id/attendance", departmentController.addAttendance); // Add attendance
router.get("/:id/attendance", departmentController.getAttendance); // Get attendance
router.post("/:id/leave", departmentController.applyLeave);

// Get leave records for a student
router.get("/:id/leave", departmentController.getLeaves);

module.exports = router;
