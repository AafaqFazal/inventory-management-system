const StockOut = require("../models/stockOutModel");

exports.stockOutMaterial = async (req, res) => {
  try {
    const rows = req.body; // Expect an array of rows

    if (!Array.isArray(rows)) {
      return res.status(400).json({ message: "Expected an array of rows" });
    }

    // First pass: Validate all rows and collect all missing fields
    const missingFieldsSet = new Set();
    let hasMissingFields = false;

    for (const row of rows) {
      if (!row.materialCode) missingFieldsSet.add("Material Code");
      if (!row.materialQty) missingFieldsSet.add("Material Quantity");
      if (!row.description) missingFieldsSet.add("Description");
      if (!row.receiverName) missingFieldsSet.add("Receiver Name");
      if (!row.unit) missingFieldsSet.add("Unit");
      if (!row.areaCode) missingFieldsSet.add("Area Code");
      if (!row.address) missingFieldsSet.add("Address");

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
        address,
        unit,
        areaCode,
        receiverName,
        createdBy,
        updatedBy,
        departmentId,
        warehouseId,
      } = row;

      // Check if an entry with the same scheme and materialCode exists
      let existingEntry = await StockOut.findOne({ scheme, materialCode });

      if (existingEntry) {
        // Update existing entry
        existingEntry.materialQty = materialQty;
        existingEntry.address = address || existingEntry.address;
        existingEntry.unit = unit || existingEntry.unit;
        existingEntry.areaCode = areaCode || existingEntry.areaCode;
        existingEntry.receiverName = receiverName || existingEntry.receiverName;
        existingEntry.updatedBy = updatedBy || existingEntry.updatedBy;
        existingEntry.updatedAt = new Date();

        await existingEntry.save();
        results.push({
          message: "Updated existing entry",
          data: existingEntry,
        });
      } else {
        // Create new entry
        const newStockOut = new StockOut({
          scheme,
          materialCode,
          materialQty,
          description,
          address,
          unit,
          areaCode,
          receiverName,
          createdBy,
          updatedBy,
          departmentId,
          warehouseId,
        });

        await newStockOut.save();
        results.push({ message: "Created new entry", data: newStockOut });
      }
    }

    return res.status(200).json({
      message: "Stock-out data processed successfully",
      results,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getCheckSchemeData = async (req, res) => {
  try {
    const scheme = decodeURIComponent(req.params.scheme.trim());
    console.log("Received scheme:", scheme);

    const data = await StockOut.find({ scheme });

    if (data.length === 0) {
      return res.status(404).json({ message: "No data found for this scheme" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching scheme data:", error);
    // Always return JSON, not HTML error pages
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get all store-in entries
exports.getAllStockOut = async (req, res) => {
  try {
    const storeInList = await StockOut.find();
    res.status(200).json(storeInList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single store-in entry by ID
exports.getStockOutById = async (req, res) => {
  try {
    const storeIn = await StockOut.findOne({ storeInId: req.params.id });
    if (!storeIn) return res.status(404).json({ error: "StockOut not found" });
    res.status(200).json(storeIn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a store-in entry
exports.updateStoreIn = async (req, res) => {
  try {
    let storeIn = await StockOut.findOne({ storeInId: req.params.id });
    if (!storeIn) return res.status(404).json({ error: "StockOut not found" });

    // If updating materialQty, add the new value to the existing one
    if (req.body.materialQty !== undefined) {
      req.body.materialQty = storeIn.materialQty + req.body.materialQty;
    }

    storeIn = await StockOut.findOneAndUpdate(
      { storeInId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(storeIn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a store-in entry
exports.deleteStockOut = async (req, res) => {
  try {
    const storeIn = await StockOut.findOneAndDelete({
      storeInId: req.params.id,
    });
    if (!storeIn) return res.status(404).json({ error: "StockOut not found" });
    res.status(200).json({ message: "StockOut deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete all entries for a specific scheme
exports.deleteStockOutByMaterialCode = async (req, res) => {
  try {
    const materialCode = decodeURIComponent(req.params.materialCode.trim());
    console.log("Received materialCode for deletion:", materialCode);

    // Delete all entries with the matching materialCode
    const result = await StockOut.deleteMany({ materialCode });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No data found for this materialCode" });
    }

    res.status(200).json({
      message: "Stock-out entries deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting stock-out entries:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

exports.getStoreInByIdOrWarehouse = async (req, res) => {
  try {
    console.log("Received warehouseId:", req.params.warehouseId); // Debugging log
    const { id, warehouseId } = req.params;

    if (id) {
      const storeIn = await StoreIn.findOne({ _id: id });
      if (!storeIn) return res.status(404).json({ error: "StoreIn not found" });
      return res.status(200).json(storeIn);
    }

    if (warehouseId) {
      const storeInData = await StockOut.find({ warehouseId });
      console.log("StoreIn Data:", storeInData); // Debugging log

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
    res.status(500).json({ error: error.message });
  }
};
