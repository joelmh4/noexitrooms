// Montaje de Express: JSON, CORS, documentación Swagger, rutas y errores (en este orden).
// Está separado de index.js para que las pruebas puedan arrancar la API sin abrir el puerto 3000.
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const entorno = require('./config/entorno');
const rutas = require('./routes/index.routes');
const logger = require('./middleware/logger.middleware');
const { manejarErrores, rutaNoEncontrada } = require('./middleware/errores.middleware');

const app = express();

app.disable("x-powered-by");
//Render va detrás de un proxy: así req.ip es la IP del cliente (la usa el límite de intentos de login)
app.set("trust proxy", 1);

//Middleware
app.use(express.json({ limit: "100kb" }));
if (process.env.NODE_ENV !== "test") app.use(logger);

//Solo el frontend configurado en CORS_ORIGIN puede leer las respuestas desde el navegador
app.use(cors({
    origin: (origen, listo) => listo(null, !origen || entorno.corsOrigenes.includes(origen)),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

//swagger: http://localhost:3000/api/docs (también en /api-docs, como en el ejemplo de clase)
app.get("/api/openapi.json", (req, res) => res.json(swaggerSpec));
app.use(["/api/docs", "/api-docs"], swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "NoExitRooms API" }));

app.use("/api", rutas);

app.use(rutaNoEncontrada);
app.use(manejarErrores);

module.exports = app;
