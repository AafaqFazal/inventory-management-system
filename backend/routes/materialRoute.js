const express = require("express");
const router = express.Router();
const materialController = require("../controller/materialController");
const multer = require("multer");
const path = require("path");

// Ensure uploads directory exists
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed"), false);
    }
  },
});

// Create a new material (with photo upload)
router.post("/", materialController.createMember);

// Get all materials
router.get("/", materialController.getAllMembers);

// IMPORTANT: Place specific routes BEFORE parameter routes
// Download all materials as JSON
router.get("/download", materialController.downloadMaterials);

// Upload materials from JSON file (directly processed)
router.post(
  "/upload",
  upload.single("file"),
  materialController.uploadMaterials
);

// AFTER specific routes, put parameter routes
// Get a material by ID
router.get("/:id", materialController.getMemberById);

// Update a material by ID (with photo upload)
router.put("/:id", materialController.updateMemberById);

// Delete a material by ID
router.delete("/:id", materialController.deleteMemberById);

module.exports = router;
