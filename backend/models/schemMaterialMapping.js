const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const schemeMaterialMappingSchema = new mongoose.Schema(
  {
    schemeMaterialMappingId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    materialName: {
      type: String,
      required: [true, "Material Name is required"],
    },
    scheme: {
      type: String,
      required: [true, "Scheme is required"],
    },
    warehouseName: {
      type: String,
      required: [true, "Warehouse Name is required"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
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
    type: {
      type: String,
      required: [true, "Type is required"],
    },
    notes: {
      type: String,
    },
    departmentId: {
      type: String,
      // required: [true, "Department ID is required"],
    },
    warehouseIdScheme: {
      type: String,
      required: [true, "Warehouse ID is required"],
    },
    updatedBy: {
      type: String,
    },
    createdBy: {
      type: String,
    },
    year: {
      type: Number,
    },
    month: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Pre-save hook to extract and store year and month
schemeMaterialMappingSchema.pre("save", function (next) {
  const now = new Date();
  this.year = now.getFullYear(); // Extract year (e.g., 2023)
  this.month = now.getMonth() + 1; // Extract month (1-12)
  next();
});

const SchemeMaterialMapping = mongoose.model(
  "schemeMaterialMapping",
  schemeMaterialMappingSchema
);

module.exports = SchemeMaterialMapping;
