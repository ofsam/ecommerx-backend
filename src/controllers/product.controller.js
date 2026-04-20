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
    const result = await db.query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET ONE =================
const getProductById = async (req, res) => {
  const result = await db.query(
    "SELECT * FROM products WHERE id=$1",
    [req.params.id]
  );
  res.json(result.rows[0]);
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
  await db.query("DELETE FROM products WHERE id=$1", [req.params.id]);
  res.json({ message: "Deleted" });
};

// ================= GET BY VENDOR =================
const getProductsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const result = await db.query(
      `SELECT * 
       FROM products
       WHERE vendor_id = $1
       ORDER BY created_at DESC`,
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
        const sku = row.ProductSku || null;
        const name = row.ProductName || null;

        if (!sku && !name) {
          failed++;
          continue;
        }

        const core = {
          product_sku: sku,
          product_name: name,
          product_description: row.ProductDescription || "",
          unit_price: row.UnitPrice || 0,
          unit_cost: row.UnitCost || 0,
          stock_quantity: row.StockQuantity || 0,
          unit_of_measure: row.UnitOfMeasure || "",
          parent_category_name: row.ParentCategoryName || "",
          sub_category_name: row.SubCategoryName || "",
          image_url: row.ImageUrl || null
        };

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
            core.product_sku,
            core.product_name,
            core.product_description,
            core.unit_price,
            core.unit_cost,
            core.stock_quantity,
            core.unit_of_measure,
            core.parent_category_name,
            core.sub_category_name,
            attributes,
            core.image_url
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

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByVendor,
  uploadExcelProducts
};