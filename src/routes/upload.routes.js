const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const { uploadExcel } = require("../controllers/upload.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// ONLY SUPER ADMIN OR VENDOR
router.post(
  "/excel",
  auth,
  role(["SUPER_ADMIN", "VENDOR_ADMIN"]),
  upload.single("file"),
  uploadExcel
);

module.exports = router;