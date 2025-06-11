// models/userPoliciesModel.js
const mongoose = require("mongoose");

// Create User Policy Schema
const userPolicySchema = new mongoose.Schema({
  roleId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userPolicyId: {
    type: String,
    required: true,
    unique: true,
  },
  rolePolicyId: {
    type: String,
    required: true,
  },
});

const UserPolicy = mongoose.model("UserPolicy", userPolicySchema);
module.exports = UserPolicy;
