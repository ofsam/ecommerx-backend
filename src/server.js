require("dotenv").config();
// require("./workers/upload.worker");
console.log("ENV DB_NAME =", process.env.DB_NAME);
console.log("ENV USER =", process.env.DB_USER);

const app = require("./app");
const setupSwagger = require("./docs/swagger");

setupSwagger(app);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});