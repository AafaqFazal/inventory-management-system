const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const storeInSchema = new mongoose.Schema(
  {
    storeInId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    scheme: {
      type: String,
      required: [true, "Scheme is required"],
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
    notes: {
      type: String,
      required: [true, "Notes are required"],
    },
    unit: {
      type: String,
    },
    warehouseId: {
      type: String,
      // required: [true, "Warehouse ID is required"],
    },
    departmentId: {
      type: String,
      // required: [true, "Department ID is required"],
    },
    updatedBy: {
      type: String,
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

const StoreIn = mongoose.model("storeIn", storeInSchema);
module.exports = StoreIn;
