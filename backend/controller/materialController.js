const MaterialModel = require("../models/materialModel");
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");

// Controller for handling CRUD operations
const materialController = {
  // Create a new member with duplicate prevention
  createMember: async (req, res) => {
    try {
      const { code, name, warehouseId, description, isActive, createdBy } =
        req.body;

      // Check for duplicate code only in the same warehouse
      const existingMaterial = await MaterialModel.findOne({
        code,
        warehouseId,
      });

      if (existingMaterial) {
        return res.status(400).json({
          error: `A material with code "${code}" already exists in this warehouse`,
          duplicateField: "code",
          duplicateValue: code,
        });
      }

      const newMember = new MaterialModel({
        code,
        name,
        warehouseId,
        description,
        isActive: isActive !== undefined ? isActive : true,
        createdBy,
        createdAt: new Date(),
        attendance: [], // Initialize attendance as an empty array
      });

      const savedMember = await newMember.save();
      res.status(201).json(savedMember);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all members with sorting by recent activity
  getAllMembers: async (req, res) => {
    try {
      const members = await MaterialModel.find()
        .populate("warehouseId", "code name")
        .sort({ updatedAt: -1, createdAt: -1 }); // Sort by most recent first
      res.status(200).json(members);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get member by ID
  getMemberById: async (req, res) => {
    try {
      const staffId = req.params.id;
      const member = await MaterialModel.findById(staffId);

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json(member);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update member by ID with duplicate prevention
  updateMemberById: async (req, res) => {
    try {
      const staffId = req.params.id;
      const updatedData = req.body;

      // Check for duplicates (excluding current document)
      if (updatedData.code || updatedData.name) {
        const existingMaterial = await MaterialModel.findOne({
          _id: { $ne: staffId },
          warehouseId: updatedData.warehouseId || req.body.warehouseId,
          $or: [{ code: updatedData.code }, { name: updatedData.name }],
        });

        if (existingMaterial) {
          let errorMessage = "Material already exists: ";
          if (existingMaterial.code === updatedData.code) {
            errorMessage += `A material with code "${updatedData.code}" already exists in this warehouse`;
          } else {
            errorMessage += `A material with name "${updatedData.name}" already exists in this warehouse`;
          }

          return res.status(400).json({
            error: errorMessage,
            duplicateField:
              existingMaterial.code === updatedData.code ? "code" : "name",
            duplicateValue:
              existingMaterial.code === updatedData.code
                ? updatedData.code
                : updatedData.name,
          });
        }
      }

      // Always set updatedAt to current time
      updatedData.updatedAt = new Date();

      const updatedMember = await MaterialModel.findByIdAndUpdate(
        staffId,
        updatedData,
        { new: true, runValidators: true }
      );

      if (!updatedMember) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json(updatedMember);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete member by ID
  deleteMemberById: async (req, res) => {
    try {
      const staffId = req.params.id;

      const deletedMember = await MaterialModel.findByIdAndDelete(staffId);

      if (!deletedMember) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json({ message: "Member deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Download materials as JSON with role-based filtering
  downloadMaterials: async (req, res) => {
    try {
      const { warehouseId, departmentId, isActive } = req.query;
      let query = {};

      // Apply filters based on query parameters
      if (warehouseId) {
        query.warehouseId = warehouseId;
      }

      if (isActive === "true") {
        query.isActive = true;
      }

      // For departmentId filtering, we need to get warehouses from that department first
      let materials;

      if (departmentId) {
        // First, find all warehouses in the specified department
        const WarehouseModel = require("../models/warehouseModel");
        const departmentWarehouses = await WarehouseModel.find({
          departmentId: departmentId,
        });
        const warehouseIds = departmentWarehouses.map((w) => w._id);

        // Then filter materials by those warehouse IDs
        materials = await MaterialModel.find({
          warehouseId: { $in: warehouseIds },
          ...query,
        }).populate("warehouseId", "code name");
      } else {
        // Standard query if no department filtering needed
        materials = await MaterialModel.find(query).populate(
          "warehouseId",
          "code name"
        );
      }

      // Format materials to include only specific fields with data and set others to empty
      const formattedMaterials = materials.map((material) => {
        return {
          code: material.code,
          name: material.name,
          description: material.description,
        };
      });

      // Set response headers for file download
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=materials.json"
      );

      // Send the JSON data
      res.status(200).json(formattedMaterials);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Upload materials from JSON file with duplicate prevention
  uploadMaterials: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse JSON directly from memory (req.file.buffer)
      let materialsData;
      try {
        materialsData = JSON.parse(req.file.buffer.toString("utf-8"));
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        return res
          .status(400)
          .json({ error: "Invalid JSON file: " + parseError.message });
      }

      if (!Array.isArray(materialsData)) {
        return res
          .status(400)
          .json({ error: "JSON file must contain an array of materials" });
      }

      // Get warehouse and user info
      const warehouseId = req.body.warehouseId;
      const createdBy = req.body.createdBy || "System (Upload)";

      if (!warehouseId) {
        return res.status(400).json({ error: "warehouseId is required" });
      }

      // Check for duplicates before inserting
      const existingMaterials = await MaterialModel.find({
        warehouseId,
        $or: [
          { code: { $in: materialsData.map((m) => m.code) } },
          { name: { $in: materialsData.map((m) => m.name) } },
        ],
      });

      if (existingMaterials.length > 0) {
        const duplicateCodes = existingMaterials.map((m) => m.code);
        const duplicateNames = existingMaterials.map((m) => m.name);

        return res.status(400).json({
          error: "Duplicate materials found in upload",
          duplicates: {
            codes: duplicateCodes,
            names: duplicateNames,
          },
          message: `Cannot upload: ${
            duplicateCodes.length > 0
              ? `Codes ${duplicateCodes.join(", ")} already exist`
              : ""
          }${
            duplicateNames.length > 0
              ? `${
                  duplicateCodes.length > 0 ? " and " : ""
                }Names ${duplicateNames.join(", ")} already exist`
              : ""
          }`,
        });
      }

      // Transform data & assign new _id for each document
      const materialsToInsert = materialsData.map((material) => ({
        _id: new ObjectId(),
        code: material.code,
        name: material.name,
        description: material.description || "",
        warehouseId,
        isActive: true,
        createdAt: new Date(),
        createdBy,
        updatedAt: null,
        updatedBy: null,
      }));

      // Insert bulk data into MongoDB
      const result = await MaterialModel.insertMany(materialsToInsert);

      res.status(200).json({
        message: `Successfully inserted ${result.length} materials`,
        insertedCount: result.length,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = materialController;
