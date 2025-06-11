const mongoose = require("mongoose");
const UserPolicy = require("../models/userPoliciesModel");
const RolePolicy = require("../models/rolePolicyModel");
const { v4: uuidv4 } = require("uuid");

// Get or Create User Policies by Role ID and User ID
exports.getOrCreateUserPolicy = async (req, res) => {
  const { roleId, userId } = req.body;

  try {
    // Check if roleId exists in RolePolicy
    const rolePolicies = await RolePolicy.find({ roleId });

    if (rolePolicies.length === 0) {
      return res
        .status(404)
        .json({ message: "No role policies found for this roleId" });
    }

    // Check if UserPolicies already exist for this roleId and userId
    const existingUserPolicies = await UserPolicy.find({ roleId, userId });

    if (existingUserPolicies.length > 0) {
      return res.status(200).json({
        message: "User policies already exist for this roleId and userId",
        userPolicies: existingUserPolicies,
      });
    }

    // Create a UserPolicy document for each RolePolicy
    const newUserPolicies = [];

    for (const policy of rolePolicies) {
      const userPolicyId = uuidv4();
      const newUserPolicy = new UserPolicy({
        roleId,
        userId,
        userPolicyId,
        rolePolicyId: policy.rolePolicyId,
      });

      await newUserPolicy.save();
      newUserPolicies.push(newUserPolicy);
    }

    return res.status(201).json({
      message: "User policies created successfully",
      userPolicies: newUserPolicies,
    });
  } catch (error) {
    console.error("Error retrieving or creating user policies:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
