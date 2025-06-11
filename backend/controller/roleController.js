const {
  createRolesWithPolicies,
  getRolesAndPolicies,
  getRolePolicies,
} = require("../services/roles");

const createRolesHandler = async (req, res) => {
  try {
    await createRolesWithPolicies();
    res
      .status(200)
      .json({ message: "Roles and policies created successfully." });
  } catch (error) {
    console.error("Error creating roles and policies:", error);
    res.status(500).json({ message: "Failed to create roles and policies." });
  }
};

const getRolesHandler = async (req, res) => {
  try {
    const rolesWithPolicies = await getRolesAndPolicies();
    res.status(200).json(rolesWithPolicies);
  } catch (error) {
    res.status(500).json({ message: "Error fetching roles and policies" });
  }
};

const getSpecificRolePoliciesHandler = async (req, res) => {
  try {
    const { roleId } = req.params; // Get the roleId from the URL params
    const rolePolicies = await getRolePolicies(roleId);
    res.status(200).json(rolePolicies);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = {
  createRolesHandler,
  getRolesHandler,
  getSpecificRolePoliciesHandler,
};
