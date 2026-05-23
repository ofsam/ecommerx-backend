// controllers/productController.js

const db = require("../config/db");
const XLSX = require("xlsx");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getRowImageUrl = (row) =>
  row.ImageUrl ||
  row.image_url ||
  row.imageUrl ||
  row["Image URL"] ||
  row["image url"] ||
  null;

const deleteOrderItemsForProducts = async (client, productIds) => {
  if (!productIds.length) return 0;

  const result = await client.query(
    `DELETE FROM order_items WHERE product_id = ANY($1::uuid[])`,
    [productIds]
  );

  return result.rowCount;
};

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
       SET product_name = COALESCE($1, product_name),
           unit_price = COALESCE($2, unit_price),
           stock_quantity = COALESCE($3, stock_quantity),
           attributes = COALESCE($4, attributes),
           image_url = COALESCE($5, image_url)
       WHERE id = $6
       RETURNING *`,
      [
        product_name ?? null,
        unit_price ?? null,
        stock_quantity ?? null,
        attributes ?? null,
        image_url ?? null,
        req.params.id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPLOAD IMAGE =================
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Only image files are allowed (JPEG, PNG, GIF, WEBP)",
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File size should be less than 5MB" });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "products/images",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto" },
          ],
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    return res.json({
      image_url: result.secure_url,
      public_id: result.public_id,
      message: "Image uploaded successfully",
    });
  } catch (err) {
    console.error("Product image upload error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ================= DELETE =================
const deleteProduct = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const removedItems = await deleteOrderItemsForProducts(client, [
      req.params.id,
    ]);

    const result = await client.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    await client.query("COMMIT");

    res.json({
      message: "Deleted",
      removedOrderItems: removedItems,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ================= DELETE ALL (SUPER ADMIN) =================
const deleteAllProducts = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const productIdsResult = await client.query("SELECT id FROM products");
    const productIds = productIdsResult.rows.map((row) => row.id);

    const removedItems = await deleteOrderItemsForProducts(client, productIds);

    const deletedProducts = await client.query(
      "DELETE FROM products RETURNING id"
    );

    await client.query("COMMIT");

    res.json({
      message: "All products deleted",
      deletedProducts: deletedProducts.rowCount,
      removedOrderItems: removedItems,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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
        getRowImageUrl(row)
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
  uploadProductImage,
  deleteProduct,
  deleteAllProducts,
  getProductsByVendor,
  uploadExcelProducts,
  getProductsByCategory,
};