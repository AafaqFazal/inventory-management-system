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

// Middleware to check if the user is a superadmin
exports.isSuperadmin = (req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") {
    next(); // Allow access
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Superadmin role required." });
  }
};

// Middleware to check if the user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role === "ADMIN") {
    next(); // Allow access
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
};

// Middleware to allow both superadmin and admin
exports.isAdminOrSuperadmin = (req, res, next) => {
  if (req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN") {
    next(); // Allow access
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Admin or Superadmin role required." });
  }
};
