const express = require("express");
const router = express.Router();
const {
  createRolesHandler,
  getRolesHandler,
  getSpecificRolePoliciesHandler,
} = require("../controller/roleController");

router.post("/createRoles", createRolesHandler);
// Route to get all roles and their associated policies
router.get("/rolePolicies", getRolesHandler);

// Route to get policies for a specific role
router.get("/specificRoles/:roleId", getSpecificRolePoliciesHandler);

module.exports = router;
