const PoMaterial = require("../models/poTrackingModel");
const { v4: uuidv4 } = require("uuid");

exports.storeInMaterial = async (req, res) => {
  try {
    const {
      scheme,
      itemCode,
      supplierName,
      description,
      brand,
      rawasiIssuedPo,
      poQty,
      unit,
      receivedPoQty,
      remainingQty,
      warehouseId,
      departmentId,
      warehouseName,
      createdBy,
      updatedBy,
    } = req.body;

    // Check if a scheme with the same scheme and materialCode exists
    // let existingEntry = await PoMaterial .findOne({
    //   scheme,
    //   materialCode,
    //   // warehouseName,
    // });

    // if (existingEntry) {
    //   // Update only the fields that are provided in req.body
    //   existingEntry.materialQty = materialQty; // Overwrite quantity instead of adding
    //   existingEntry.type = type || existingEntry.type;
    //   existingEntry.unit = unit || existingEntry.unit;
    //   existingEntry.notes = notes || existingEntry.notes;
    //   existingEntry.warehouseName =
    //     warehouseName || existingEntry.warehouseName;

    //   existingEntry.updatedAt = new Date(); // Update timestamp

    //   await existingEntry.save();

    //   return res.status(200).json({
    //     message: "Scheme found, updated successfully",
    //     data: existingEntry,
    //   });
    // }

    // If scheme does not exist, create a new one
    const newPoTracking = new PoMaterial({
      // poTradingId: uuidv4(),
      scheme,
      itemCode,
      description,
      supplierName,
      brand,
      rawasiIssuedPo,
      poQty,
      unit,
      receivedPoQty,
      remainingQty,
      warehouseId,
      departmentId,
      warehouseName,
      createdBy,
      updatedBy,
    });

    await newPoTracking.save();

    return res.status(201).json({
      message: "New scheme created successfully",
      data: newPoTracking,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
exports.getCheckSchemeData = async (req, res) => {
  try {
    const scheme = decodeURIComponent(req.params.scheme.trim()); // Decode and trim extra spaces

    console.log("Received scheme:", scheme); // Debugging log

    const data = await PoMaterial.find({ scheme });

    if (data.length === 0) {
      return res.status(404).json({ message: "No data found for this scheme" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching scheme data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all store-in entries
exports.getAllStoreIn = async (req, res) => {
  try {
    const storeInList = await PoMaterial.find();
    res.status(200).json(storeInList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single store-in entry by ID
exports.getStoreInById = async (req, res) => {
  try {
    const storeIn = await PoMaterial.findById(req.params.id);
    if (!storeIn)
      return res.status(404).json({ error: "PoMaterial  not found" });
    res.status(200).json(storeIn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a store-in entry
exports.updateStoreIn = async (req, res) => {
  try {
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);

    let storeIn = await PoMaterial.findById(req.params.id);
    if (!storeIn)
      return res.status(404).json({ error: "PoMaterial not found" });

    // If updating materialQty, add the new value to the existing one
    if (req.body.materialQty !== undefined) {
      req.body.materialQty = storeIn.materialQty + req.body.materialQty;
    }

    storeIn = await PoMaterial.findOneAndUpdate(
      { _id: req.params.id }, // Use _id instead of storeInId
      req.body,
      { new: true, runValidators: true }
    );

    console.log("Updated storeIn:", storeIn);
    res.status(200).json(storeIn);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a store-in entry
const mongoose = require("mongoose");

exports.deleteStoreIn = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Invalid ID format" });
    }

    // Attempt to delete the document
    const storeIn = await PoMaterial.findByIdAndDelete(id);

    // If no document is found, return a 404 error
    if (!storeIn) {
      return res.status(404).json({ error: "PoMaterial  not found" });
    }

    // If the document is found and deleted, return a success message
    res.status(200).json({ message: "PoMaterial  deleted successfully" });
  } catch (error) {
    // Handle any unexpected errors
    res.status(500).json({ error: error.message });
  }
};
