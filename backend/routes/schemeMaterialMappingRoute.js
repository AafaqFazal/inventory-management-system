const express = require("express");
const router = express.Router();
const {
  storeInMaterial,
  getAllStoreIn,
  getStoreInById,
  updateStoreIn,
  deleteStoreIn,
  getCheckSchemeData,
} = require("../controller/schemeMaterialMappingController");
// const { authenticate, isSuperadmin } = require("../middleware/roleMiddleware");

// Apply SUPER_ADMIN restriction to all routes
router.post("/schemeMaterialMapping", storeInMaterial);
router.get("/checkSchemeMaterialMapping/:scheme", getCheckSchemeData);
router.get("/schemeMaterialMapping", getAllStoreIn);
router.get("/schemeMaterialMapping/:id", getStoreInById);
router.put("/schemeMaterialMapping/:id", updateStoreIn);
router.delete("/schemeMaterialMapping/:id", deleteStoreIn);

module.exports = router;
