const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  uploadProductImage,
  deleteProduct,
  deleteAllProducts,
  uploadExcelProducts,
  getProductsByVendor,
  getProductsByCategory,
} = require("../controllers/product.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const uploadImage = require("../middleware/upload.middleware");

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

// IMAGE UPLOAD (returns image_url for create/update body)
router.post(
  "/upload-image",
  auth,
  role(["SUPER_ADMIN", "VENDOR_ADMIN"]),
  uploadImage.single("image"),
  uploadProductImage
);

// DELETE ALL (must be before /:id)
router.delete("/", auth, role(["SUPER_ADMIN"]), deleteAllProducts);

// DELETE ONE
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