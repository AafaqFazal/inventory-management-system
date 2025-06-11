const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  fromUser: {
    type: String,
    // ref: "User",
    required: true,
  },
  toUser: {
    type: String,
    // ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["unread", "read"], // Correct field name and values
    default: "unread",
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
