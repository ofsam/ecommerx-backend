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

// CRUD
router.post("/", auth, createProduct);
router.get("/", auth, getProducts);
router.get("/:id", auth, getProductById);
router.put("/:id", auth, updateProduct);
router.delete("/:id", auth, deleteProduct);
router.get("/vendor/:vendorId", auth, getProductsByVendor);
router.get("/products/category/:category", getProductsByCategory);
// EXCEL UPLOAD
router.post(
  "/upload-excel",
  auth,
  role(["SUPER_ADMIN", "VENDOR_ADMIN"]),
  upload.single("file"),
  uploadExcelProducts
);

module.exports = router;