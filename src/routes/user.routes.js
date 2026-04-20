const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUsersByRole,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// ================= SUPER ADMIN ONLY =================
router.get("/", auth, role(["SUPER_ADMIN"]), getAllUsers);
router.get("/role/:role", auth, role(["SUPER_ADMIN"]), getUsersByRole);
router.get("/:id", auth, role(["SUPER_ADMIN"]), getUserById);
router.post("/", auth, role(["SUPER_ADMIN"]), createUser);
router.put("/:id", auth, role(["SUPER_ADMIN"]), updateUser);
router.delete("/:id", auth, role(["SUPER_ADMIN"]), deleteUser);

module.exports = router;