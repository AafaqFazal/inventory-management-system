const Role = require("../models/roleModel");
const RolePolicy = require("../models/rolePolicyModel");
const { v4: uuidv4 } = require("uuid");
const createRolesWithPolicies = async () => {
  try {
    const roles = [
      {
        roleName: "SUPER_ADMIN",
        policies: [
          {
            URL: "/dashboard",
            order: 1,
            URL_Name: "Dashboard",
            Icon: "/assets/icons/navbar/dashboard.png",
            isActive: true,
          },
          {
            URL: "/departments",
            order: 2,
            URL_Name: "Departments",
            Icon: "/assets/icons/navbar/department.png",
            isActive: true,
          },
          {
            URL: "/warehouse",
            order: 3,
            URL_Name: "Warehouses",
            Icon: "/assets/icons/navbar/warehouse.png",
            isActive: true,
          },
          {
            URL: "/schemes",
            order: 4,
            URL_Name: "Schemes",
            Icon: "/assets/icons/navbar/scheme.png",
            isActive: true,
          },
          {
            URL: "/materials",
            order: 5,
            URL_Name: "Materials",
            Icon: "/assets/icons/navbar/material.png",
            isActive: true,
          },
          {
            URL: "/user-management",
            order: 6,
            URL_Name: "User Management",
            Icon: "/assets/icons/navbar/user-mgmt.png",
            isActive: true,
          },
          {
            URL: "/stock-management",
            order: 7,
            URL_Name: "Stock Management",
            Icon: "/assets/icons/navbar/stock.png",
            isActive: true,
          },
          {
            URL: "/stock-report",
            order: 8,
            URL_Name: "Stock Report",
            Icon: "/assets/icons/navbar/stockreport.png",
            isActive: true,
          },
        ],
      },
      {
        roleName: "MANAGER",
        policies: [
          {
            URL: "/dashboard",
            order: 1,
            URL_Name: "Dashboard",
            Icon: "/assets/icons/navbar/dashboard.png",
            isActive: true,
            mode: "READ_ONLY",
          },
          {
            URL: "/warehouse",
            order: 2,
            URL_Name: "Warehouses",
            Icon: "/assets/icons/navbar/warehouse.png",
            isActive: true,
            mode: "READ_ONLY",
          },
          {
            URL: "/schemes",
            order: 3,
            URL_Name: "Schemes",
            Icon: "/assets/icons/navbar/scheme.png",
            isActive: true,
            mode: "READ_ONLY",
          },
          {
            URL: "/materials",
            order: 4,
            URL_Name: "Materials",
            Icon: "/assets/icons/navbar/material.png",
            isActive: true,
            mode: "READ_ONLY",
          },
          {
            URL: "/stock-management",
            order: 5,
            URL_Name: "Stock Management",
            Icon: "/assets/icons/navbar/stock.png",
            isActive: true,
            mode: "READ_ONLY",
          },
          {
            URL: "/stock-report",
            order: 6,
            URL_Name: "Stock Report",
            Icon: "/assets/icons/navbar/stockreport.png",
            isActive: true,
            mode: "READ_ONLY",
          },
          {
            URL: "/po-tracking",
            order: 7,
            URL_Name: "RWS PO's Tracking",
            Icon: "/assets/icons/navbar/potracking.png",
            isActive: true,
            mode: "READ_ONLY",
          },
        ],
      },
      {
        roleName: "WAREHOUSE_USER",
        policies: [
          {
            URL: "/dashboard",
            order: 1,
            URL_Name: "Dashboard",
            Icon: "/assets/icons/navbar/dashboard.png",
            isActive: true,
          },
          {
            URL: "/schemes",
            order: 2,
            URL_Name: "Schemes",
            Icon: "/assets/icons/navbar/scheme.png",
            isActive: true,
          },
          {
            URL: "/materials",
            order: 3,
            URL_Name: "Materials",
            Icon: "/assets/icons/navbar/material.png",
            isActive: true,
          },
          {
            URL: "/stock-management",
            order: 4,
            URL_Name: "Stock Management",
            Icon: "/assets/icons/navbar/stock.png",
            isActive: true,
          },
          {
            URL: "/stock-report",
            order: 5,
            URL_Name: "Stock Report",
            Icon: "/assets/icons/navbar/stockreport.png",
            isActive: true,
          },
          {
            URL: "/po-tracking",
            order: 6,
            URL_Name: "RWS PO's Tracking",
            Icon: "/assets/icons/navbar/potracking.png",
            isActive: true,
          },
        ],
      },
    ];

    for (const role of roles) {
      // Check if the role already exists
      let existingRole = await Role.findOne({ roleName: role.roleName });

      if (!existingRole) {
        // If not, create the role with a new roleId using uuid
        const newRoleId = uuidv4();
        existingRole = new Role({
          roleName: role.roleName,
          roleId: newRoleId,
        });
        await existingRole.save();
        console.log(`Role "${role.roleName}" added.`);
      } else {
        console.log(`Role "${role.roleName}" already exists.`);
      }

      // Check existing policies for the role
      const existingPolicies = await RolePolicy.find({
        roleId: existingRole.roleId,
      });

      const existingPolicyUrls = existingPolicies.map((policy) => policy.URL);

      for (const policy of role.policies) {
        if (!existingPolicyUrls.includes(policy.URL)) {
          // If policy doesn't exist, create a new one
          const rolePolicy = new RolePolicy({
            Icon: policy.Icon,
            URL: policy.URL,
            URL_Name: policy.URL_Name,
            isActive: policy.isActive,
            order: policy.order,
            roleId: existingRole.roleId, // Reference to the roleId
            rolePolicyId: uuidv4(),
            mode: policy.mode,
          });

          await rolePolicy.save(); // Save once with all fields set

          console.log(
            `Policy "${policy.URL_Name}" added for role "${role.roleName}".`
          );
        } else {
          console.log(
            `Policy "${policy.URL_Name}" already exists for role "${role.roleName}".`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error creating roles and policies:", error);
  }
};

// Get all roles and their associated policies
const getRolesAndPolicies = async () => {
  try {
    const roles = await Role.find(); // Get all roles
    const rolesWithPolicies = [];

    for (const role of roles) {
      // Find policies associated with each role
      const policies = await RolePolicy.find({ roleId: role.roleId });
      rolesWithPolicies.push({
        roleName: role.roleName,
        roleId: role.roleId,
        policies: policies,
      });
    }

    return rolesWithPolicies;
  } catch (error) {
    console.error("Error fetching roles and policies:", error);
    throw error;
  }
};

// Get policies for a specific role
const getRolePolicies = async (roleId) => {
  try {
    const role = await Role.findOne({ roleId }); // Find role by roleId
    if (!role) {
      throw new Error("Role not found");
    }

    const policies = await RolePolicy.find({ roleId: role.roleId }); // Find policies for this role
    return {
      roleName: role.roleName,
      roleId: role.roleId,
      policies: policies,
    };
  } catch (error) {
    console.error("Error fetching policies for role:", error);
    throw error;
  }
};

module.exports = {
  createRolesWithPolicies,
  getRolesAndPolicies,
  getRolePolicies,
};
