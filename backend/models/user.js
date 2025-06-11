const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// Create User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "Admin",
  },
  roleId: {
    type: String,
    required: true,
  },
  warehouse: {
    type: String,
    // required: true,
  },
  department: {
    type: String,
    required: true,
  },
  warehouseId: {
    type: String,
    // required: true,
  },
  departmentId: {
    type: String,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Export User model
const User = mongoose.model("User", userSchema);
module.exports = User;
