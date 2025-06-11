const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Role = require("../models/roleModel");
const { v4: uuidv4 } = require("uuid");
const { generateToken } = require("../utils/jwtUtils");
const mongoose = require("mongoose");

// Register User
exports.register = async (req, res) => {
  const {
    email,
    password,
    role,
    roleId,
    warehouse,
    department,
    fullName,
    departmentId,
    warehouseId,
  } = req.body;

  try {
    // Validate required fields
    if (
      !fullName ||
      !email ||
      !password ||
      !role ||
      !roleId ||
      // !warehouse ||
      !department ||
      !departmentId
      // !warehouseId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email domain
    const allowedDomain = "@rawasialbina.com";
    if (!email.endsWith(allowedDomain)) {
      return res.status(400).json({
        message: `Only emails with ${allowedDomain} domain are allowed`,
      });
    }

    // Validate `roleId`
    const existingRole = await Role.findOne({ roleId });
    if (!existingRole) {
      return res
        .status(400)
        .json({ message: "Invalid roleId: Role does not exist" });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate userId
    const userId = uuidv4();

    // Create new user
    const newUser = new User({
      email,
      userId,
      password,
      role,
      roleId,
      warehouse,
      department,
      warehouseId,
      departmentId,
      fullName,
    });

    // Save the user in the database
    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser.userId, newUser.role);

    return res.status(201).json({
      message: "User registered successfully",
      userId: newUser.userId,
      token,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email, ensuring they are not soft-deleted
    const user = await User.findOne({ email, isDeleted: { $ne: true } });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid credentials or account deleted" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user.userId, user.role);

    // Return user data and token
    return res.status(200).json({
      message: "Login successful",
      user: {
        email: user.email,
        fullName: user.fullName,
        userId: user.userId,
        role: user.role,
        roleId: user.roleId,
        warehouse: user.warehouse,
        department: user.department,
        warehouseId: user.warehouseId,
        departmentId: user.departmentId,
      },
      token,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get Users (Include Password)
exports.getUsers = async (req, res) => {
  try {
    // Fetch users who are not soft deleted
    const users = await User.find({ isDeleted: { $ne: true } });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    // Fetch users who are not soft deleted
    const users = await User.find({ isDeleted: false });

    // Mask passwords before returning
    const maskedUsers = users.map((user) => ({
      ...user.toObject(),
      password: "********", // Mask password
    }));

    return res.status(200).json({ users: maskedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const {
    fullName,
    email,
    role,
    roleId,
    warehouse,
    department,
    warehouseId,
    departmentId,
    password,
  } = req.body;

  try {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    const user = isValidObjectId
      ? await User.findById(userId)
      : await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (roleId) {
      const existingRole = await Role.findOne({ roleId });
      if (!existingRole) {
        return res
          .status(400)
          .json({ message: "Invalid roleId: Role does not exist" });
      }
    }

    const updates = {
      fullName: fullName ?? user.fullName,
      role: role ?? user.role,
      roleId: roleId ?? user.roleId,
      warehouse: warehouse ?? user.warehouse,
      department: department ?? user.department,
      warehouseId: warehouseId ?? user.warehouseId,
      departmentId: departmentId ?? user.departmentId,
    };

    if (email) {
      const emailDomain = email.split("@")[1];
      if (emailDomain !== "rawasialbina.com") {
        return res.status(400).json({
          message: "Invalid email domain. Only rawasialbina.com is allowed.",
        });
      }
      updates.email = email;
    }

    // Password update handling
    if (password) {
      // Hash the password with bcrypt
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, updates, {
      new: true,
      runValidators: false,
    });

    // Don't return the password in the response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return res
      .status(200)
      .json({ message: "User updated successfully", user: userResponse });
  } catch (error) {
    console.error("Error updating user:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete User by _id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  // Validate if ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    // Convert string ID to ObjectId
    const user = await User.findById(new mongoose.Types.ObjectId(id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(400).json({ message: "User is already deleted" });
    }

    // Soft delete without validation
    user.isDeleted = true;
    await user.save({ validateBeforeSave: false }); // ✅ Disable validation

    return res.status(200).json({ message: "User soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting user:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete All Users by _id

exports.deleteAllUsers = async (req, res) => {
  try {
    // Soft delete all users
    await User.updateMany({}, { isDeleted: true });

    return res
      .status(200)
      .json({ message: "All users soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting all users:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
