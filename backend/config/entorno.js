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
  //Dirección de MongoDB: en local mongodb://127.0.0.1:27017/noexitrooms y en producción la de MongoDB Atlas
  mongoUrl: obligatoria("MONGO_URL"),
  token: {
    password: obligatoria("TOKEN_PASSWORD"),
    caduca: process.env.TOKEN_EXPIRES || "8h"
  },
  // Direcciones del frontend que pueden llamar a la API (varias separadas por comas)
  corsOrigenes: (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim()).filter(Boolean)
};

module.exports = entorno;
