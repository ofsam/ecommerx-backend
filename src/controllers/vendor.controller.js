const db = require("../config/db");
const bcrypt = require("bcryptjs");
const sendEmail = require("../services/email.service");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// ================= CLOUDINARY CONFIG =================
// Add these to your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================= UTIL =================
const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

// ================= UPLOAD LOGO =================
const uploadLogo = async (req, res) => {
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
          folder: "vendors/logos",
          transformation: [
            { width: 200, height: 200, crop: "limit" },
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
      logo_url: result.secure_url,
      public_id: result.public_id,
      message: "Logo uploaded successfully",
    });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ================= CREATE VENDOR =================
const createVendor = async (req, res) => {
  const client = await db.connect();

  try {
    console.log("🚀 CREATE VENDOR STARTED");

    const { vendor_code, name, email, phone, logo_url } = req.body;

    const tempPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await client.query("BEGIN");

    // 1. CREATE VENDOR
    const vendorResult = await client.query(
      `INSERT INTO vendors (vendor_code, name, email, phone, logo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [vendor_code || `V-${Date.now()}`, name, email, phone, logo_url]
    );

    const vendor = vendorResult.rows[0];

    // 2. CREATE VENDOR ADMIN
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, vendor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, vendor_id`,
      [email, hashedPassword, "VENDOR_ADMIN", vendor.id]
    );

    const vendorAdmin = userResult.rows[0];

    await client.query("COMMIT");

    console.log("✅ Vendor + Admin created");

    // 3. SEND EMAIL
    try {
      await sendEmail(
        email,
        "Your Vendor Account - Ecommerx",
        `
       <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Ecommerx</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); margin:20px auto;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding:40px 30px; text-align:center;">
                            <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:700;">Welcome to Ecommerx 🚀</h1>
                            <p style="color:#e0e7ff; margin:10px 0 0; font-size:16px;">Your vendor account is now active</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding:40px 30px;">
                            <p style="font-size:18px; color:#1f2937; margin:0 0 25px;">Hello <strong>${name}</strong>,</p>
                            
                            <p style="color:#4b5563; line-height:1.6; margin-bottom:30px;">
                                We're excited to have you as a vendor on Ecommerx! Here's your account information:
                            </p>
                            
                            <!-- Details Card -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:30px;">
                                <tr>
                                    <td style="padding:25px;">
                                        <p style="margin:0 0 12px;"><strong style="color:#1f2937;">Vendor Name:</strong> <span style="color:#374151;">${name}</span></p>
                                        <p style="margin:0 0 12px;"><strong style="color:#1f2937;">Email:</strong> <span style="color:#374151;">${email}</span></p>
                                        <p style="margin:0;"><strong style="color:#1f2937;">Temporary Password:</strong> <span style="color:#374151; font-family: monospace; background:#fef3c7; padding:2px 6px; border-radius:4px;">${tempPassword}</span></p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Login Button -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="http://localhost:3000/login" 
                                           style="background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:16px 32px; border-radius:6px; font-size:17px; font-weight:600; display:inline-block;">
                                            Login to Your Vendor Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="text-align:center; color:#6b7280; font-size:14px; margin:20px 0 0;">
                                Or copy this link:<br>
                                <a href="http://localhost:3000/login" style="color:#4f46e5; word-break:break-all;">http://localhost:3000/login</a>
                            </p>
                            
                            <!-- Security Notice -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:35px; background-color:#fef2f2; border:1px solid #fecaca; border-radius:8px;">
                                <tr>
                                    <td style="padding:20px; color:#b91c1c; font-size:15px; line-height:1.5;">
                                        🔒 <strong>Please change your password immediately</strong> after your first login for security reasons.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc; padding:30px; text-align:center; border-top:1px solid #e2e8f0;">
                            <p style="margin:0 0 8px; color:#6b7280; font-size:13px;">
                                &copy; 2026 Ecommerx. All rights reserved.
                            </p>
                            <p style="margin:0; color:#6b7280; font-size:12px;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
      );

      console.log("📨 Email sent");
    } catch (emailErr) {
      console.log("❌ Email failed:", emailErr.message);
    }

    return res.json({
      message: "Vendor created successfully",
      vendor,
      vendorAdmin
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.log("❌ ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ================= GET ALL VENDORS =================
const getVendors = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM vendors ORDER BY created_at DESC"
    );

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ================= GET VENDOR BY ID =================
const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM vendors WHERE id = $1",
      [id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE VENDOR =================
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, is_active, is_verified, logo_url } = req.body;

    const result = await db.query(
      `UPDATE vendors
       SET 
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         is_active = COALESCE($3, is_active),
         is_verified = COALESCE($4, is_verified),
         logo_url = COALESCE($5, logo_url),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, phone, is_active, is_verified, logo_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE VENDOR =================
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Delete logo from Cloudinary if exists
    const vendor = await db.query("SELECT logo_url FROM vendors WHERE id = $1", [id]);
    if (vendor.rows[0]?.logo_url) {
      try {
        // Extract public_id from URL and delete
        const publicId = vendor.rows[0].logo_url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryErr) {
        console.log("Failed to delete logo from Cloudinary:", cloudinaryErr.message);
      }
    }

    await db.query("DELETE FROM vendors WHERE id = $1", [id]);

    return res.json({ message: "Vendor deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ================= GET VENDOR ADMIN =================
const getVendorAdmin = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const result = await db.query(
      `SELECT id, email, role, vendor_id, created_at
       FROM users
       WHERE vendor_id = $1 AND role = 'VENDOR_ADMIN'`,
      [vendorId]
    );

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ================= EXPORT =================
module.exports = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  getVendorAdmin,
  uploadLogo, // Add this export
};