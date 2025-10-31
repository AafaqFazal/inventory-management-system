const StoreIn = require("../models/storeInModel");
const mongoose = require("mongoose");

// Helper function to handle validation errors
const handleValidationError = (error, res) => {
  const errors = Object.values(error.errors).map((e) => e.message);
  return res.status(400).json({ message: "Validation failed", errors });
};

// Helper function to handle duplicate key errors
const handleDuplicateKeyError = (error, res) => {
  const field = Object.keys(error.keyPattern)[0];
  return res
    .status(400)
    .json({ message: `Duplicate key error: ${field} already exists` });
};

// Helper function to handle general errors
const handleServerError = (error, res) => {
  console.error("Server error:", error);
  return res
    .status(500)
    .json({ message: "Server error", error: error.message });
};

// Store in material
exports.storeInMaterial = async (req, res) => {
  try {
    const rows = req.body; // Expect an array of rows

    if (!Array.isArray(rows)) {
      return res.status(400).json({ message: "Expected data in the rows" });
    }

    // First pass: Validate all rows and collect all missing fields
    const missingFieldsSet = new Set();
    let hasMissingFields = false;

    for (const row of rows) {
      if (!row.materialCode) missingFieldsSet.add("Material Code");
      if (!row.materialQty) missingFieldsSet.add("Quantity");
      if (!row.description) missingFieldsSet.add("Description");
      if (!row.notes) missingFieldsSet.add("Notes");

      if (missingFieldsSet.size > 0) {
        hasMissingFields = true;
      }
    }

    // If any missing fields found, return error immediately
    if (hasMissingFields) {
      return res.status(400).json({
        message: "Some required fields are missing",
        missingFields: Array.from(missingFieldsSet),
      });
    }

    // Second pass: Process all rows if validation passed
    const results = [];
    for (const row of rows) {
      const {
        scheme,
        materialCode,
        materialQty,
        description,
        type,
        notes,
        unit,
        createdBy,
        updatedBy,
        departmentId,
        warehouseId,
      } = row;

      // Check if an entry with the same scheme and materialCode exists
      let existingEntry = await StoreIn.findOne({ scheme, materialCode });

      if (existingEntry) {
        // Update existing entry
        existingEntry.materialQty = materialQty; // Overwrite quantity
        existingEntry.type = type || existingEntry.type;
        existingEntry.notes = notes || existingEntry.notes;
        existingEntry.unit = unit || existingEntry.unit;
        existingEntry.updatedBy = updatedBy || existingEntry.updatedBy;
        existingEntry.updatedAt = new Date(); // Update timestamp

        await existingEntry.save();
        results.push({
          message: "Updated existing entry",
          data: existingEntry,
        });
      } else {
        // Create new entry
        const newStoreIn = new StoreIn({
          scheme,
          materialCode,
          materialQty,
          description,
          type,
          notes,
          unit,
          createdBy,
          updatedBy,
          departmentId,
          warehouseId,
        });

        await newStoreIn.save();
        results.push({ message: "Created new entry", data: newStoreIn });
      }
    }

    return res.status(200).json({
      message: "Stock-in data processed successfully",
      results,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return handleValidationError(error, res);
    }
    if (error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    return handleServerError(error, res);
  }
};

// Get check scheme data
exports.getCheckSchemeData = async (req, res) => {
  try {
    const scheme = decodeURIComponent(req.params.scheme.trim()); // Decode and trim extra spaces

    if (!scheme) {
      return res.status(400).json({ message: "Scheme/PO is required" });
    }

    const data = await StoreIn.find({ scheme });

    if (data.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    res.json(data);
  } catch (error) {
    return handleServerError(error, res);
  }
};

// Get all store-in entries
exports.getAllStoreIn = async (req, res) => {
  try {
    const storeInList = await StoreIn.find();
    res.status(200).json(storeInList);
  } catch (error) {
    return handleServerError(error, res);
  }
};

// Get a single store-in entry by ID
exports.getStoreInById = async (req, res) => {
  try {
    const storeIn = await StoreIn.findOne({ storeInId: req.params.id });

    if (!storeIn) {
      return res.status(404).json({ message: "StoreIn not found" });
    }

    res.status(200).json(storeIn);
  } catch (error) {
    return handleServerError(error, res);
  }
};

// Update a store-in entry
// Update a store-in entry
exports.updateStoreIn = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    let storeIn = await StoreIn.findById(id);

    if (!storeIn) {
      return res.status(404).json({ message: "StoreIn not found" });
    }

    // Update the fields
    const { materialQty, unit, notes } = req.body;

    if (materialQty !== undefined) storeIn.materialQty = materialQty;
    if (unit !== undefined) storeIn.unit = unit;
    if (notes !== undefined) storeIn.notes = notes;

    // Set updated timestamp and updatedBy
    storeIn.updatedAt = new Date();
    storeIn.updatedBy = req.body.updatedBy || storeIn.updatedBy;

    await storeIn.save();

    res.status(200).json(storeIn);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return handleValidationError(error, res);
    }
    return handleServerError(error, res);
  }
};

// Delete a store-in entry
exports.deleteStoreIn = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Attempt to delete the document
    const storeIn = await StoreIn.findByIdAndDelete(id);

    if (!storeIn) {
      return res.status(404).json({ message: "StoreIn not found" });
    }

    res.status(200).json({ message: "StoreIn deleted successfully" });
  } catch (error) {
    return handleServerError(error, res);
  }
};

// Get store-in by ID or warehouse
exports.getStoreInByIdOrWarehouse = async (req, res) => {
  try {
    const { id, warehouseId } = req.params;

    if (id) {
      const storeIn = await StoreIn.findOne({ _id: id });

      if (!storeIn) {
        return res.status(404).json({ message: "StoreIn not found" });
      }

      return res.status(200).json(storeIn);
    }

    if (warehouseId) {
      const storeInData = await StoreIn.find({ warehouseId });

      if (storeInData.length === 0) {
        return res
          .status(404)
          .json({ message: "No data found for this warehouse" });
      }

      return res.status(200).json(storeInData);
    }

    res
      .status(400)
      .json({ message: "Either storeInId or warehouseId is required" });
  } catch (error) {
    return handleServerError(error, res);
  }
};
