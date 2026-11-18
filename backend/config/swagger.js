// Documentación de la API con swagger-jsdoc: lee los comentarios @swagger de las rutas
// y las piezas comunes (esquemas y respuestas) de swagger-componentes.yaml.
// Se ve en http://localhost:3000/api/docs
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "NoExitRooms API",
      version: "1.0.0",
      description:
        "API REST de NoExitRooms: salas de escape, reservas y soporte por tickets.\n" +
        "Las rutas con candado necesitan la cabecera `Authorization: Bearer <token>`, " +
        "que se obtiene con `POST /auth/login`."
    },
    servers: [{ url: "/api" }]
  },
  apis: [
    path.join(__dirname, "swagger-componentes.yaml"),
    path.join(__dirname, "..", "routes", "*.js")
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
