const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getUsers,
  updateUser,
  deleteUser,
  deleteAllUsers,
} = require("../controller/userController");

// Route to add user to MongoDB
router.post("/register", register);
router.post("/login", login);
router.get("/getusers", getUsers);
router.put("/updateusers/:userId", updateUser); // Update a user

// for specific
router.delete("/deleteUser/:id", deleteUser); // Delete a user
// for all
router.delete("/deleteAllUsers", deleteAllUsers); // Delete a user

module.exports = router;
