const db = require("../config/db");

const getOrCreateCategory = async (name, parentId = null) => {
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  let category = await db.query(
    `SELECT * FROM categories WHERE slug = $1 AND parent_id IS NOT DISTINCT FROM $2`,
    [slug, parentId]
  );

  if (category.rows.length > 0) {
    return category.rows[0];
  }

  const newCat = await db.query(
    `INSERT INTO categories (name, slug, parent_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, slug, parentId]
  );

  return newCat.rows[0];
};

module.exports = { getOrCreateCategory };