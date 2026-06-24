import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HS Furniture API",
      version: "1.0.0",
      description: "HS Furniture E-commerce REST API — Node.js + Express + MongoDB",
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token — obtained from POST /api/auth/login (also set as HttpOnly cookie)",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpecs = swaggerJsdoc(options);

export default swaggerSpecs;
