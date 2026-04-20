const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("🔐 AUTH HEADER:", authHeader);

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, "SECRET_KEY");

    req.user = decoded;

    console.log("✅ AUTH SUCCESS:", decoded);

    return next();
  } catch (err) {
    console.log("❌ AUTH ERROR:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;