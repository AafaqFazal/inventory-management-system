const mongoose = require("mongoose");
const MaterialSchema = new mongoose.Schema({
  code: String,
  name: String,
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    // required: true,
  },
  description: String,
  isActive: Boolean,
  createdAt: { type: Date, default: Date.now },
  createdBy: String,
  updatedBy: String,
  updatedAt: Date,
  //   attendance: [AttendanceSchema], // Array of attendance records
  //   leaves: [LeaveSchema], // Array of leave records
});

const MaterialModel = mongoose.model("Material", MaterialSchema);
module.exports = MaterialModel;
