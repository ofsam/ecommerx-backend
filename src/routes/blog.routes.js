const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const {
  createBlog,
  uploadBlogImage,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} = require("../controllers/blog.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// Protect all routes
router.use(auth);

// Image upload route
router.post("/upload-image", upload.single("image"), uploadBlogImage);

// Blog CRUD routes
router.post("/", role(["SUPER_ADMIN", "ADMIN"]), createBlog);
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.put("/:id", role(["SUPER_ADMIN", "ADMIN"]), updateBlog);
router.delete("/:id", role(["SUPER_ADMIN", "ADMIN"]), deleteBlog);

module.exports = router;