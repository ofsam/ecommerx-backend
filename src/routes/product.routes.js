const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadExcelProducts,
  getProductsByVendor,
  getProductsByCategory
} = require("../controllers/product.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// ================= GET ROUTES =================

// ✅ CATEGORY (MUST COME FIRST)
router.get("/category/:category", auth, getProductsByCategory);

// ✅ BY VENDOR
router.get("/vendor/:vendorId", auth, getProductsByVendor);

// ✅ ALL PRODUCTS
router.get("/",  getProducts);

// ✅ SINGLE PRODUCT (ALWAYS LAST)
router.get("/:id", auth, getProductById);


// ================= MUTATION ROUTES =================

// CREATE
router.post("/", auth, createProduct);

// UPDATE
router.put("/:id", auth, updateProduct);

// DELETE
router.delete("/:id", auth, deleteProduct);


// ================= EXCEL UPLOAD =================

router.post(
  "/upload-excel",
  auth,
  role(["SUPER_ADMIN", "VENDOR_ADMIN"]),
  upload.single("file"), // MUST be "file"
  uploadExcelProducts
);

module.exports = router;