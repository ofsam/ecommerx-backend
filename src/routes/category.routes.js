const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getParentCategories,
  getSubCategories
} = require("../controllers/category.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// CREATE CATEGORY (ADMIN ONLY)
router.post(
  "/",
  auth,
  role(["SUPER_ADMIN"]),
  createCategory
);

// GET ALL
router.get("/", auth, getCategories);

// GET PARENTS
router.get("/parents", auth, getParentCategories);

// GET SUBCATEGORIES
router.get("/sub/:parentId", auth, getSubCategories);

module.exports = router;