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
        const core = {
          product_sku: row.ProductSku || null,
          product_name: row.ProductName || null,
          product_description: row.ProductDescription || "",
          unit_price: row.UnitPrice || 0,
          unit_cost: row.UnitCost || 0,
          stock_quantity: row.StockQuantity || 0,
          unit_of_measure: row.UnitOfMeasure || "",
          parent_category_name: row.ParentCategoryName || "",
          sub_category_name: row.SubCategoryName || "",
          image_url: row.image_url || null,
        };

        if (!core.product_sku && !core.product_name) {
          failed++;
          continue;
        }

        // ================= CATEGORY AUTO CREATE =================
        let parentCategoryId = null;
        let subCategoryId = null;

        if (core.parent_category_name) {
          const parentSlug = core.parent_category_name
            .toLowerCase()
            .replace(/\s+/g, "-");

          const parentRes = await db.query(
            `INSERT INTO categories (name, slug)
             VALUES ($1, $2)
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [core.parent_category_name, parentSlug]
          );

          parentCategoryId = parentRes.rows[0].id;
        }

        if (core.sub_category_name && parentCategoryId) {
          const subSlug = core.sub_category_name
            .toLowerCase()
            .replace(/\s+/g, "-");

          const subRes = await db.query(
            `INSERT INTO categories (name, slug, parent_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [core.sub_category_name, subSlug, parentCategoryId]
          );

          subCategoryId = subRes.rows[0].id;
        }

        // ================= ATTRIBUTES =================
        const attributes = { ...row };
        delete attributes.ProductSku;
        delete attributes.ProductName;
        delete attributes.ProductDescription;
        delete attributes.UnitPrice;
        delete attributes.UnitCost;
        delete attributes.StockQuantity;
        delete attributes.UnitOfMeasure;
        delete attributes.ParentCategoryName;
        delete attributes.SubCategoryName;
        delete attributes.image_url;

        // ================= INSERT PRODUCT =================
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
            parent_category_id,
            sub_category_id,
            attributes,
            image_url
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [
            vendor_id,
            core.product_sku,
            core.product_name,
            core.product_description,
            core.unit_price,
            core.unit_cost,
            core.stock_quantity,
            core.unit_of_measure,
            core.parent_category_name,
            core.sub_category_name,
            parentCategoryId,
            subCategoryId,
            attributes,
            core.image_url,
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
      total: rows.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const result = await db.query(
      `SELECT 
        p.*,
        v.name AS vendor_name
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.parent_category_id = $1
         OR p.sub_category_id = $1
      ORDER BY p.created_at DESC`,
      [categoryId]
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