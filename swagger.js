// swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UTEShop API Documentation",
      version: "1.0.0",
      description:
        "Tài liệu API hệ thống mua bán đồ trường đại học Sư phạm Kỹ thuật",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local server",
      },
    ],
  },
  apis: ["./routes/*.js"], // nơi chứa các file định nghĩa API
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
