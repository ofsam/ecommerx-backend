const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const port = process.env.PORT || 5000;
const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerx API",
      version: "1.0.0",
      description:
        "Multi-vendor ecommerce SaaS API. Use **Authorize** with a JWT from `POST /api/auth/login`.",
    },
    servers: [
      {
        url: baseUrl,
        description: process.env.NODE_ENV === "production" ? "Production" : "Local",
      },
    ],
  },
  apis: [
    path.join(__dirname, "schemas.js"),
    path.join(__dirname, "paths.js"),
    path.join(__dirname, "../routes/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Ecommerx API Docs",
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
};

module.exports = setupSwagger;
