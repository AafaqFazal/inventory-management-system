const SchemeModel = require("../models/schemeModel");
const WarehouseModel = require("../models/warehouseModel")

// Controller for handling CRUD operations
const schemeController = {
  // Create a new member
  createMember: async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        warehouseId,
        isActive,
        createdAt,
        createdBy,
        updatedBy,
        updatedAt,
      } = req.body;

      const newMember = new SchemeModel({
        code,
        name,
        description,
        warehouseId,
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
      const members = await SchemeModel.find().populate(
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
      const member = await SchemeModel.findById(staffId);

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

      const updatedMember = await SchemeModel.findByIdAndUpdate(
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

      const deletedMember = await SchemeModel.findByIdAndDelete(staffId);

      if (!deletedMember) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json({ message: "Member deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = schemeController;
