const db = require("../config/db");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary (use your existing config)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================= UPLOAD BLOG IMAGE =================
const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Only image files are allowed (JPEG, PNG, GIF, WEBP)" });
    }

    // Validate file size (5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File size should be less than 5MB" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "blogs/images",
          transformation: [
            { width: 1200, height: 630, crop: "limit" },
            { quality: "auto" }
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
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
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ================= CREATE BLOG =================
const createBlog = async (req, res) => {
  const client = await db.connect();
  
  try {
    const { title, content, image_url, author } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO blogs (title, content, image_url, author)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content, image_url || null, author || "Admin"]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Blog created successfully",
      blog: result.rows[0],
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create blog error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ================= GET ALL BLOGS =================
const getAllBlogs = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM blogs ORDER BY created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Get blogs error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ================= GET BLOG BY ID =================
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM blogs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Get blog error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE BLOG =================
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image_url, author } = req.body;

    const result = await db.query(
      `UPDATE blogs
       SET 
         title = COALESCE($1, title),
         content = COALESCE($2, content),
         image_url = COALESCE($3, image_url),
         author = COALESCE($4, author)
       WHERE id = $5
       RETURNING *`,
      [title, content, image_url, author, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }

    return res.json({
      message: "Blog updated successfully",
      blog: result.rows[0],
    });
  } catch (err) {
    console.error("Update blog error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ================= DELETE BLOG =================
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `DELETE FROM blogs WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }

    return res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete blog error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createBlog,
  uploadBlogImage,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};