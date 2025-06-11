const WarehouseModel = require("../models/warehouseModel");
const DepartmentModel = require("../models/departmentModel");

// Controller for handling CRUD operations
const warehouseController = {
  // Create a new member
  createMember: async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        departmentId,
        isActive,
        city,
        area,
        warehouseCode,
        createdAt,
        createdBy,
        updatedBy,
        updatedAt,
      } = req.body;

      const newMember = new WarehouseModel({
        code,
        name,
        description,
        departmentId,
        isActive,
        city,
        area,
        warehouseCode,
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
      const members = await WarehouseModel.find().populate(
        "departmentId",
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
      const member = await WarehouseModel.findById(staffId);

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

      const updatedMember = await WarehouseModel.findByIdAndUpdate(
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

      const deletedMember = await WarehouseModel.findByIdAndDelete(staffId);

      if (!deletedMember) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json({ message: "Member deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Add attendance record for a member
  addAttendance: async (req, res) => {
    try {
      const staffId = req.params.id;
      const { date, clockIn, clockOut } = req.body;

      // Find the member and update attendance
      const member = await WarehouseModel.findById(staffId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Push new attendance data into member object
      member.attendance = member.attendance || [];
      member.attendance.push({ date, clockIn, clockOut });

      await member.save();

      // Return updated member data including attendance
      res.status(200).json({
        ...member._doc,
        attendance: member.attendance,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get attendance for a member
  getAttendance: async (req, res) => {
    try {
      const staffId = req.params.id;
      const member = await WarehouseModel.findById(staffId);

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Return attendance records
      res.status(200).json(member.attendance || []);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Apply leave for a member
  applyLeave: async (req, res) => {
    try {
      const staffId = req.params.id;
      const { date, type } = req.body; // Type will be either 'full' or 'half'

      // Find the member and update leave records
      const member = await WarehouseModel.findById(staffId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Add the leave to the member's leave array
      member.leaves = member.leaves || [];
      member.leaves.push({ date, type });

      await member.save();

      // Return updated member data with leaves
      res.status(200).json({
        ...member._doc,
        leaves: member.leaves,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all leaves for a member
  getLeaves: async (req, res) => {
    try {
      const staffId = req.params.id;
      const member = await WarehouseModel.findById(staffId);

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Return leave records
      res.status(200).json(member.leaves || []);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = warehouseController;
