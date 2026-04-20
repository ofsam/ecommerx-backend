const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware"); // Add this line

const {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  getVendorAdmin,
  uploadLogo,
} = require("../controllers/vendor.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// SUPER ADMIN ONLY
router.post("/", auth, role(["SUPER_ADMIN"]), createVendor);
router.put("/:id", auth, role(["SUPER_ADMIN"]), updateVendor);
router.delete("/:id", auth, role(["SUPER_ADMIN"]), deleteVendor);

// AUTHENTICATED USERS
router.get("/", auth, getVendors);
router.get("/:id", auth, getVendorById);

// LOGO UPLOAD - Add auth protection if needed
router.post("/upload-logo", auth, role(["SUPER_ADMIN"]), upload.single("logo"), uploadLogo);

// GET VENDOR ADMIN
router.get(
  "/admin/:vendorId",
  auth,
  role(["SUPER_ADMIN"]),
  getVendorAdmin
);

module.exports = router;