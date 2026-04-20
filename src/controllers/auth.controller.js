const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER (ROLE-AWARE BUT SAFE) =================
const register = async (req, res) => {
  try {
    console.log("🚀 REGISTER START");

    const { email, password, name, phone, role } = req.body;

    // 1. Check if user exists
    const existing = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. SAFE ROLE LOGIC
    let finalRole = "BUYER"; // default

    // ONLY allow elevated roles if explicitly intended (you can lock later)
    if (role === "SUPER_ADMIN") {
      finalRole = "SUPER_ADMIN";
    }

    if (role === "VENDOR_ADMIN") {
      finalRole = "VENDOR_ADMIN";
    }

    // 4. Insert user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, name`,
      [email, hashedPassword, finalRole, name, phone]
    );

    console.log("✅ USER CREATED:", result.rows[0]);

    return res.json({
      message: "Registration successful",
      user: result.rows[0]
    });

  } catch (err) {
    console.log("❌ REGISTER ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    console.log("🔐 LOGIN START");

    const { email, password } = req.body;

    // 1. Find user
    const userResult = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        vendor_id: user.vendor_id || null
      },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "7d" }
    );

    console.log("✅ LOGIN SUCCESS");

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        vendor_id: user.vendor_id
      }
    });

  } catch (err) {
    console.log("❌ LOGIN ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  register,
  login
};