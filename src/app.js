const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/product.routes");

const blogRoutes = require("./routes/blog.routes");
const app = express();

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
app.use("/api", require("./routes/blog.setup.route"));
app.use("/api/products", productRoutes);
app.use("/api/blogs", blogRoutes);

module.exports = app;