const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/product.routes");


const app = express();

const cors = require("cors");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://e-commerxx.netlify.app"
    ],
    credentials: true,
  })
);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/vendors", require("./routes/vendor.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));

app.use("/api/products", productRoutes);

module.exports = app;