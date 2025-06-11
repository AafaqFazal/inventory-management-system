const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const stockOutSchema = new mongoose.Schema(
  {
    stockOutId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    scheme: {
      type: String,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    materialCode: {
      type: String,
      required: [true, "Material Code is required"],
    },
    materialQty: {
      type: Number,
      required: [true, "Material Quantity is required"],
      min: [1, "Material Quantity must be at least 1"],
    },
    receiverName: {
      type: String,
      required: [true, "Receiver Name is required"],
    },
    areaCode: {
      type: String,
      required: [true, "Area Code is required"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    warehouseId: {
      type: String,
    },
    departmentId: {
      type: String,
    },
    createdBy: {
      type: String,
    },
    updatedBy: {
      type: String,
    },
    year: {
      type: Number,
    },
    month: {
      type: Number,
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

const StockOut = mongoose.model("stockOut", stockOutSchema);
module.exports = StockOut;
