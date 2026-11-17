// Variables de entorno (.env en local, panel de Render en producción).
// Si falta una obligatoria, el servidor no arranca: mejor fallar al inicio que a mitad de una petición.
require("dotenv").config({ quiet: true });

function obligatoria(nombre) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} (mira .env.example)`);
  return valor;
}

const entorno = {
  puerto: Number(process.env.PORT || 3000),
  db: {
    host: obligatoria("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    user: obligatoria("DB_USER"),
    password: process.env.DB_PASSWORD || "",
    database: obligatoria("DB_NAME"),
    ssl: process.env.DB_SSL === "true",
    // Certificado del proveedor (Aiven lo da en su panel). Si se guarda con \n, se convierten en saltos de línea
    ca: process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, "\n") : undefined
  },
  token: {
    password: obligatoria("TOKEN_PASSWORD"),
    caduca: process.env.TOKEN_EXPIRES || "8h"
  },
  // Direcciones del frontend que pueden llamar a la API (varias separadas por comas)
  corsOrigenes: (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim()).filter(Boolean)
};

module.exports = entorno;
