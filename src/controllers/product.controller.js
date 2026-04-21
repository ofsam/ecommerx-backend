// controllers/productController.js

const db = require("../config/db");
const XLSX = require("xlsx");

// ================= CREATE =================
const createProduct = async (req, res) => {
  try {
    const vendor_id =
      req.user.role === "SUPER_ADMIN"
        ? req.body.vendor_id
        : req.user.vendor_id;

    const {
      product_sku,
      product_name,
      product_description,
      unit_price,
      unit_cost,
      stock_quantity,
      unit_of_measure,
      parent_category_name,
      sub_category_name,
      attributes,
      image_url
    } = req.body;

    const result = await db.query(
      `INSERT INTO products (
        vendor_id,
        product_sku,
        product_name,
        product_description,
        unit_price,
        unit_cost,
        stock_quantity,
        unit_of_measure,
        parent_category_name,
        sub_category_name,
        attributes,
        image_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        vendor_id,
        product_sku,
        product_name,
        product_description,
        unit_price,
        unit_cost,
        stock_quantity,
        unit_of_measure,
        parent_category_name,
        sub_category_name,
        attributes || {},
        image_url || null
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET ALL =================
const getProducts = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        v.name AS vendor_name
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET ONE =================
const getProductById = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT 
        p.*,
        v.name AS vendor_name
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.id = $1
    `,
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE =================
const updateProduct = async (req, res) => {
  try {
    const {
      product_name,
      unit_price,
      stock_quantity,
      attributes,
      image_url
    } = req.body;

    const result = await db.query(
      `UPDATE products
       SET product_name=$1,
           unit_price=$2,
           stock_quantity=$3,
           attributes=$4,
           image_url=$5
       WHERE id=$6
       RETURNING *`,
      [
        product_name,
        unit_price,
        stock_quantity,
        attributes || {},
        image_url || null,
        req.params.id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE =================
const deleteProduct = async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET BY VENDOR =================
const getProductsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const result = await db.query(
      `
      SELECT 
        p.*,
        v.name AS vendor_name
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.vendor_id = $1
      ORDER BY p.created_at DESC
    `,
      [vendorId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrCreateCategory = async (name, parent_id = null) => {
  if (!name) return null;

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  try {
    const existing = await db.query(
      "SELECT * FROM categories WHERE slug=$1 LIMIT 1",
      [slug]
    );

    if (existing.rows.length) return existing.rows[0];

    const created = await db.query(
      `INSERT INTO categories (name, slug, parent_id)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [name, slug, parent_id]
    );

    return created.rows[0];
  } catch (err) {
    console.log("Category error:", err.message);
    return null; // prevent crash
  }
};

// ================= EXCEL UPLOAD =================
const uploadExcelProducts = async (req, res) => {
  try {
    const vendor_id =
      req.user.role === "SUPER_ADMIN"
        ? req.body.vendor_id
        : req.user.vendor_id;

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let success = 0;
    let failed = 0;

   for (const row of rows) {
  try {
    const sku = row.ProductSku || null;
    const name = row.ProductName || null;

    if (!sku && !name) {
      failed++;
      continue;
    }

    // ✅ CREATE CATEGORIES
    const parentCategory = await getOrCreateCategory(row.ParentCategoryName);

    const subCategory = await getOrCreateCategory(
      row.SubCategoryName,
      parentCategory?.id
    );

    // ✅ CLEAN ATTRIBUTES
    const attributes = { ...row };

    delete attributes.ProductSku;
    delete attributes.ProductName;
    delete attributes.UnitPrice;
    delete attributes.UnitCost;
    delete attributes.StockQuantity;
    delete attributes.ProductDescription;
    delete attributes.UnitOfMeasure;
    delete attributes.ParentCategoryName;
    delete attributes.SubCategoryName;
    delete attributes.ImageUrl;

    // ✅ INSERT PRODUCT
    await db.query(
      `INSERT INTO products (
        vendor_id,
        product_sku,
        product_name,
        product_description,
        unit_price,
        unit_cost,
        stock_quantity,
        unit_of_measure,
        parent_category_name,
        sub_category_name,
        attributes,
        image_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        vendor_id,
        sku,
        name,
        row.ProductDescription || "",
        Number(row.UnitPrice) || 0,
        Number(row.UnitCost) || 0,
        Number(row.StockQuantity) || 0,
        row.UnitOfMeasure || "",
        row.ParentCategoryName || "",
        row.SubCategoryName || "",
        attributes,
        row.ImageUrl || null
      ]
    );

    success++;
  } catch (err) {
    console.log("Row failed:", err.message);
    failed++;
  }
}

    res.json({
      message: "Upload completed",
      success,
      failed,
      total: rows.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const result = await db.query(
      `
      SELECT *
      FROM products
      WHERE parent_category_name = $1
         OR sub_category_name = $1
      ORDER BY created_at DESC
      `,
      [category]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByVendor,
  uploadExcelProducts,
  getProductsByCategory
};