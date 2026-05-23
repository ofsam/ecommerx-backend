require("dotenv").config();
// require("./workers/upload.worker");

const app = require("./app");
const setupSwagger = require("./docs/swagger");

setupSwagger(app);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});