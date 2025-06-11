const express = require("express");
const router = express.Router();
const schemeController = require("../controller/schemeController");
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
router.post("/", schemeController.createMember);

// Get all schemes
router.get("/", schemeController.getAllMembers);

// Get a student by ID
router.get("/:id", schemeController.getMemberById);

// Update a student by ID (with photo upload)
router.put("/:id", upload.single("photo"), schemeController.updateMemberById);

// Delete a student by ID
router.delete("/:id", schemeController.deleteMemberById);

module.exports = router;
