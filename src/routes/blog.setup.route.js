const router = require("express").Router();
const db = require("../config/db");

// TEMP: create table via API
router.get("/create-blog-table", async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        author TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    res.json({ message: "Blog table created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;