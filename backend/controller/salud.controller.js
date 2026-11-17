// GET /api/health: comprueba que la API está viva y llega a la base de datos (útil tras desplegar)
const mongoose = require("mongoose");

const salud = async (req, res) => {
    let baseDeDatos = "ok";
    try {
        await mongoose.connection.db.admin().ping();
    } catch {
        baseDeDatos = "sin conexión";
    }
    res.status(baseDeDatos === "ok" ? 200 : 503).json({ api: "ok", baseDeDatos, hora: new Date().toISOString() });
};

module.exports = { salud };
