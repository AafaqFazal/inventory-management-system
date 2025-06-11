const mongoose = require("mongoose");
// const { Schema, model, Types } = mongoose;

const warehouseSchema = new mongoose.Schema({
  code: String,
  name: String,
  description: String,
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  city: String,
  area: String,
  isActive: Boolean,
  warehouseCode: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: String,
  updatedBy: String,
  updatedAt: Date,
});

const WarehouseModel = mongoose.model("Warehouse", warehouseSchema);
module.exports = WarehouseModel;
