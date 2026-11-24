// GET /api/health: comprueba que la API está viva y conectada a MongoDB (útil tras desplegar)
const mongoose = require("mongoose");

const salud = async (req, res) => {
    //readyState 1 = conectada
    const baseDeDatos = mongoose.connection.readyState === 1 ? "ok" : "sin conexión";
    res.status(baseDeDatos === "ok" ? 200 : 503).json({ api: "ok", baseDeDatos, hora: new Date().toISOString() });
};

module.exports = { salud };
