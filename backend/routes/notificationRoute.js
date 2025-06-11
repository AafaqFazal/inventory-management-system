const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");

// Routes
router.post("/", notificationController.createNotification); // Create notification
router.get("/:userId", notificationController.getUserNotifications); // Get notifications for a user
router.put("/read/:notificationId", notificationController.markAsRead); // Mark as read
// Route to mark all notifications as read
router.patch("/mark-all-as-read", notificationController.markAllAsRead); // Mark as read
router.delete("/:notificationId", notificationController.deleteNotification); // Delete notification

module.exports = router;
