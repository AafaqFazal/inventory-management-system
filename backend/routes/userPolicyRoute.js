const mongoose = require("mongoose");

const express = require("express");
const router = express.Router();
const userPolicyController = require("../controller/userPolicyController");

// Route to get or create user policy by roleId and userId
router.post("/user-policies", userPolicyController.getOrCreateUserPolicy);

module.exports = router;
