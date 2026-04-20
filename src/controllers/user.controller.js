const db = require("../config/db");

// ================= GET ALL USERS =================
const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, role, vendor_id, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET USER BY ID =================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, email, role, vendor_id, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= CREATE USER =================
const createUser = async (req, res) => {
  try {
    const { email, role, vendor_id } = req.body;

    const result = await db.query(
      `INSERT INTO users (email, role, vendor_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, role, vendor_id, created_at`,
      [email, role, vendor_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE USER =================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, vendor_id } = req.body;

    const result = await db.query(
      `UPDATE users
       SET email = $1,
           role = $2,
           vendor_id = $3
       WHERE id = $4
       RETURNING id, email, role, vendor_id, created_at`,
      [email, role, vendor_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE USER =================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET USERS BY ROLE =================
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const result = await db.query(
      `SELECT id, email, role, vendor_id, created_at
       FROM users
       WHERE role = $1
       ORDER BY created_at DESC`,
      [role]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
};