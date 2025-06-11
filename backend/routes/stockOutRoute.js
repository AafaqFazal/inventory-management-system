const express = require("express");
const router = express.Router();
const stockOutController = require("../controller/stockOutController");

router.post("/stockout", stockOutController.stockOutMaterial);
router.get(
  "/stockout/checkscheme/:scheme",
  stockOutController.getCheckSchemeData
);
router.get("/stockout", stockOutController.getAllStockOut);
router.get("/stockout/:id", stockOutController.getStockOutById);
router.delete("/stockout/:id", stockOutController.deleteStockOut);
router.delete(
  "/stockout/materialCode/:materialCode",
  stockOutController.deleteStockOutByMaterialCode
);

router.get(
  "/stockout/warehouse/:warehouseId",
  stockOutController.getStoreInByIdOrWarehouse
);

module.exports = router;
