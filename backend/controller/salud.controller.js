// GET /api/health: comprueba que la API está viva y llega a la base de datos (útil tras desplegar)
const { sequelize } = require("../config/db");

const salud = async (req, res) => {
    let baseDeDatos = "ok";
    try {
        await sequelize.query("SELECT 1");
    } catch {
        baseDeDatos = "sin conexión";
    }
    res.status(baseDeDatos === "ok" ? 200 : 503).json({ api: "ok", baseDeDatos, hora: new Date().toISOString() });
};

module.exports = { salud };
