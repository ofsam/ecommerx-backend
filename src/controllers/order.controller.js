const db = require("../config/db");

// ===============================
// CREATE ORDER (CHECKOUT)
// ===============================
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vendor_id, items, shipping_address, payment_method } = req.body;

    let totalAmount = 0;

    const client = await db.connect();
    
    try {
      await client.query("BEGIN");

      // 1. CREATE ORDER
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, vendor_id, total_amount, status, shipping_address, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, vendor_id, 0, 'pending', JSON.stringify(shipping_address), payment_method]
      );

      const order = orderResult.rows[0];

      // 2. PROCESS EACH ITEM
      for (let item of items) {
        // Get product details
        const productResult = await client.query(
          `SELECT * FROM products WHERE id = $1`,
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        const product = productResult.rows[0];
        
        // Get the unit price - handle both string and number
        const unitPrice = parseFloat(product.unit_price || product.price || 0);
        const quantity = parseInt(item.quantity);
        const total = unitPrice * quantity;

        totalAmount += total;

        // Insert order item
        await client.query(
          `INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price
          )
          VALUES ($1, $2, $3, $4, $5)`,
          [
            order.id,
            product.id,
            quantity,
            unitPrice,
            total
          ]
        );

        // Reduce stock
        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity - $1
           WHERE id = $2 AND stock_quantity >= $1`,
          [quantity, product.id]
        );
      }

      // 3. UPDATE ORDER TOTAL
      await client.query(
        `UPDATE orders SET total_amount = $1 WHERE id = $2`,
        [totalAmount, order.id]
      );

      await client.query("COMMIT");

      res.json({
        message: "Order created successfully",
        orderId: order.id,
        totalAmount: totalAmount
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET USER ORDERS
// ===============================
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET ORDER DETAILS
// ===============================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id]
    );

    const items = await db.query(
      `SELECT oi.*, p.product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      order: order.rows[0],
      items: items.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getOrdersByBuyer = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT * FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getOrdersByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const result = await db.query(
      `SELECT o.*
       FROM orders o
       WHERE o.vendor_id = $1
       ORDER BY o.created_at DESC`,
      [vendorId]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM orders
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrdersByBuyer,
  getOrdersByVendor,
  getAllOrders
};