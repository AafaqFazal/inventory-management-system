const express = require("express");
const router = express.Router();
const {
  storeInMaterial,
  getAllStoreIn,
  getStoreInById,
  updateStoreIn,
  deleteStoreIn,
  getCheckSchemeData,
} = require("../controller/poTrackingController");
// const { authenticate, isSuperadmin } = require("../middleware/roleMiddleware");

// Apply SUPER_ADMIN restriction to all routes
router.post("/poTracking", storeInMaterial);
router.get("/poTracking/:scheme", getCheckSchemeData);
router.get("/poTracking", getAllStoreIn);
router.get("/poTracking/:id", getStoreInById);
router.put("/poTracking/:id", updateStoreIn);
router.delete("/poTracking/:id", deleteStoreIn);

module.exports = router;
