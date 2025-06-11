const Notification = require("../models/notificationModel");

// Create a notification
exports.createNotification = async (req, res) => {
  try {
    const { fromUser, toUser, message } = req.body;

    if (!fromUser || !toUser || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const notification = new Notification({ fromUser, toUser, message });
    await notification.save();

    res
      .status(201)
      .json({ message: "Notification sent successfully", notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get notifications for a specific user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ toUser: userId }).sort({
      date: -1,
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: "read", readTime: new Date() }, // Use "status" instead of "isRead"
      { new: true } // Return the updated document
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark All notification as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body; // Get userId from the request body

    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      { toUser: userId, status: "unread" }, // Use `toUser` instead of `userId`
      { status: "read", readTime: new Date() } // Update: mark as read and set readTime
    );

    // Check if any notifications were updated
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "No unread notifications found" });
    }

    // Send success response
    res.status(200).json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount, // Number of notifications updated
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);

    // Handle specific errors
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Generic server error response
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const deletedNotification = await Notification.findByIdAndDelete(
      notificationId
    );

    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
