const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, "my_super_secret_key_12345", {
    expiresIn: "1h", // Token expires in 1 hour
  });
};

// Verify JWT Token
const { verifyToken } = require("../utils/jwtUtils");

exports.authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = { generateToken, verifyToken };
