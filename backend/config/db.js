// Conexión a MongoDB con Mongoose. La URL sale del .env (MONGO_URL):
// en local mongodb://127.0.0.1:27017/noexitrooms y en producción la de MongoDB Atlas.
const mongoose = require("mongoose");
const entorno = require("./entorno");

const conectar = () => mongoose.connect(entorno.mongoUrl);

const desconectar = () => mongoose.disconnect();

// 1 = conectada (lo usa GET /api/health)
const estaConectada = () => mongoose.connection.readyState === 1;

module.exports = { conectar, desconectar, estaConectada };
