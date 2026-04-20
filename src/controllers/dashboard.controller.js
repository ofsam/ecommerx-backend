const db = require("../config/db");

// ===============================
// VENDOR DASHBOARD SUMMARY
// ===============================
const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id; // 🔥 from token

    // TOTAL ORDERS
    const orders = await db.query(
      `SELECT COUNT(*) FROM orders WHERE vendor_id = $1`,
      [vendorId]
    );

    // TOTAL REVENUE
    const revenue = await db.query(
      `SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE vendor_id = $1`,
      [vendorId]
    );

    // TOTAL PRODUCTS
    const products = await db.query(
      `SELECT COUNT(*) FROM products WHERE vendor_id = $1`,
      [vendorId]
    );

    // LOW STOCK
    const lowStock = await db.query(
      `SELECT COUNT(*) FROM products 
       WHERE vendor_id = $1 AND stock_quantity < 5`,
      [vendorId]
    );

    // RECENT ORDERS
    const recentOrders = await db.query(
      `SELECT * FROM orders 
       WHERE vendor_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [vendorId]
    );

    res.json({
      totalOrders: Number(orders.rows[0].count),
      totalRevenue: Number(revenue.rows[0].coalesce),
      totalProducts: Number(products.rows[0].count),
      lowStockProducts: Number(lowStock.rows[0].count),
      recentOrders: recentOrders.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getVendorDashboard
};