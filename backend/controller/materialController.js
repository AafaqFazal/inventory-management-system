const MaterialModel = require("../models/materialModel");
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");
// Controller for handling CRUD operations
const materialController = {
  // Create a new member
  createMember: async (req, res) => {
    try {
      const {
        code,
        name,
        warehouseId,
        description,
        isActive,
        createdAt,
        createdBy,
        updatedBy,
        updatedAt,
      } = req.body;

      const newMember = new MaterialModel({
        code,
        name,
        warehouseId,
        description,
        isActive,
        createdAt,
        createdBy,
        updatedBy,
        updatedAt,
        attendance: [], // Initialize attendance as an empty array
      });

      const savedMember = await newMember.save();
      res.status(201).json(savedMember);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all members
  getAllMembers: async (req, res) => {
    try {
      const members = await MaterialModel.find().populate(
        "warehouseId",
        "code name"
      );
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

  // Update member by ID
  updateMemberById: async (req, res) => {
    try {
      const staffId = req.params.id;
      const updatedData = req.body;

      const updatedMember = await MaterialModel.findByIdAndUpdate(
        staffId,
        updatedData,
        { new: true }
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
        const WarehouseModel = require("../models/warehouseModel"); // Import warehouse model
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
          code: material.code, // Include code
          name: material.name, // Include name
          description: material.description, // Include description
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

  // Upload materials from JSON file

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
      const updatedBy = null;

      if (!warehouseId) {
        return res.status(400).json({ error: "warehouseId is required" });
      }

      // Transform data & assign new _id for each document
      const materialsToInsert = materialsData.map((material) => ({
        _id: new ObjectId(), // Ensure unique ID
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
