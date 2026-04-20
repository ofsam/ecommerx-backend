const express = require("express");
const router = express.Router();

const { getVendorDashboard } = require("../controllers/dashboard.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// ONLY VENDOR ADMIN
router.get(
  "/vendor",
  auth,
  role(["VENDOR_ADMIN"]),
  getVendorDashboard
);

module.exports = router;