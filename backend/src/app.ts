// Montaje de Express: seguridad básica, JSON, CORS, documentación, rutas y errores (en este orden)
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { entorno } from "./config/entorno";
import { manejarErrores, rutaNoEncontrada } from "./middleware/errores";
import { rutas } from "./routes";

export const app = express();

app.disable("x-powered-by");
// Render y otros servicios van detrás de un proxy: así req.ip es la del cliente
app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));

// Solo el frontend configurado puede leer las respuestas desde el navegador (sin "*")
app.use(cors({
  origin: (origen, listo) => listo(null, !origen || entorno.corsOrigenes.includes(origen)),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Documentación Swagger en /api/docs (el YAML se lee de src/docs tanto en desarrollo como compilado)
const rutaYaml = path.join(__dirname, "..", "src", "docs", "openapi.yaml");
const documento = YAML.parse(fs.readFileSync(rutaYaml, "utf8"));
app.get("/api/openapi.json", (_req, res) => { res.json(documento); });
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(documento, { customSiteTitle: "NoExitRooms API" }));

app.use("/api", rutas);

app.use(rutaNoEncontrada);
app.use(manejarErrores);
