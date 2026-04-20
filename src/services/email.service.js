const dotenv = require("dotenv");
dotenv.config(); // 👈 VERY IMPORTANT

const nodemailer = require("nodemailer");

console.log("📡 SMTP CHECK:", process.env.SMTP_HOST);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    console.log("📧 Sending via:", process.env.SMTP_HOST);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
  } catch (err) {
    console.log("❌ EMAIL ERROR:", err.message);
    throw err;
  }
};

module.exports = sendEmail;