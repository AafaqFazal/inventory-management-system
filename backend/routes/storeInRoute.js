const express = require("express");
const router = express.Router();
const {
  storeInMaterial,
  getAllStoreIn,
  getStoreInById,
  updateStoreIn,
  deleteStoreIn,
  getCheckSchemeData,
  getStoreInByIdOrWarehouse,
} = require("../controller/storeInController");
// const { authenticate, isSuperadmin } = require("../middleware/roleMiddleware");

// Apply SUPER_ADMIN restriction to all routes
router.post("/storein", storeInMaterial);
router.get("/checkscheme/:scheme", getCheckSchemeData);
router.get("/storein", getAllStoreIn);
router.get("/storein/:id", getStoreInById);
router.put("/storein/:id", updateStoreIn);
router.delete("/storein/:id", deleteStoreIn);
// ✅ FIXED: Correct route and prevent conflicts
router.get("/storein/warehouse/:warehouseId", getStoreInByIdOrWarehouse);

module.exports = router;
