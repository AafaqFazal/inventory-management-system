const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema({
  code: String,
  name: String,
  description: String,
  isActive: Boolean,
  createdAt: { type: Date, default: Date.now },
  createdBy: String,
  updatedBy: String,
  updatedAt: Date,
  // attendance: [AttendanceSchema], // Array of attendance records
  // leaves: [LeaveSchema], // Array of leave records
});

const DepartmentModel = mongoose.model("Department", DepartmentSchema);
module.exports = DepartmentModel;
