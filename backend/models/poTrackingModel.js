const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const poTrackingModel = new mongoose.Schema(
  {
    itemCode: { type: String, required: true },
    description: { type: String, required: true },
    supplierName: { type: String, required: true },
    brand: { type: String, required: true },
    scheme: { type: String },
    rawasiIssuedPo: { type: String },
    warehouseName: { type: String },
    unit: { type: String, required: true },
    poQty: { type: String, required: true },
    receivedPoQty: { type: String, required: true },
    remainingQty: { type: String },
    departmentId: { type: String, required: true },
    warehouseId: { type: String },
    updatedBy: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true }
);

const poMaterial = mongoose.model("poTracking", poTrackingModel);
module.exports = poMaterial;
