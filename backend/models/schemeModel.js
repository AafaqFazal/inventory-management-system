const mongoose = require("mongoose");
const SchemeSchema = new mongoose.Schema({
  code: String,
  name: String,
  description: String,
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  isActive: Boolean,
  createdAt: { type: Date, default: Date.now },
  createdBy: String,
  updatedBy: String,
  updatedAt: Date,
  //   attendance: [AttendanceSchema], // Array of attendance records
  //   leaves: [LeaveSchema], // Array of leave records
});

const SchemeModel = mongoose.model("Scheme", SchemeSchema);
module.exports = SchemeModel;
