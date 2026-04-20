const express = require("express");
const router = express.Router();

const role = require("../middleware/role.middleware");
const auth = require("../middleware/auth.middleware");

const {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrdersByBuyer,
  getAllOrders,
  getOrdersByVendor
} = require("../controllers/order.controller");

/**
 * =========================
 * CREATE ORDER
 * =========================
 */
router.post("/", auth, createOrder);

/**
 * =========================
 * USER ORDERS (logged-in user)
 * =========================
 */
router.get("/", auth, getUserOrders);

/**
 * =========================
 * BUYER ORDERS
 * =========================
 */
router.get("/buyer", auth, getOrdersByBuyer);

/**
 * =========================
 * VENDOR ORDERS
 * =========================
 */
router.get("/vendor/:vendorId", auth, getOrdersByVendor);

/**
 * =========================
 * ADMIN - ALL ORDERS
 * =========================
 */
router.get(
  "/all",
  auth,
  role(["SUPER_ADMIN"]),
  getAllOrders
);

/**
 * =========================
 * SINGLE ORDER DETAILS
 * =========================
 */
router.get("/:id", auth, getOrderById);

module.exports = router;