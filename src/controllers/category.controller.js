const db = require("../config/db");

// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const result = await db.query(
      `INSERT INTO categories (name, slug, parent_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, slug, parent_id || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL CATEGORIES (TREE STRUCTURE)
const getCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM categories ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PARENT CATEGORIES ONLY
const getParentCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM categories WHERE parent_id IS NULL`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SUBCATEGORIES
const getSubCategories = async (req, res) => {
  try {
    const { parentId } = req.params;

    const result = await db.query(
      `SELECT * FROM categories WHERE parent_id = $1`,
      [parentId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getParentCategories,
  getSubCategories
};