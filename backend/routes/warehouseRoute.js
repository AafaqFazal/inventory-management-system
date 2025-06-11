const express = require("express");
const router = express.Router();
const warehouseController = require("../controller/warehouseController");
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
router.post("/", upload.single("photo"), warehouseController.createMember);

// Get all students
router.get("/", warehouseController.getAllMembers);

// Get a student by ID
router.get("/:id", warehouseController.getMemberById);

// Update a student by ID (with photo upload)
router.put(
  "/:id",
  upload.single("photo"),
  warehouseController.updateMemberById
);

// Delete a student by ID
router.delete("/:id", warehouseController.deleteMemberById);

// Attendance functionality routes
router.post("/:id/attendance", warehouseController.addAttendance); // Add attendance
router.get("/:id/attendance", warehouseController.getAttendance); // Get attendance
router.post("/:id/leave", warehouseController.applyLeave);

// Get leave records for a student
router.get("/:id/leave", warehouseController.getLeaves);

module.exports = router;
