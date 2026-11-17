// Punto de entrada: conecta con MongoDB y arranca el servidor
const app = require('./app');
const entorno = require('./config/entorno');
const { conectar } = require('./config/db');

conectar()
    .then(() => {
        console.log("BBDD en marcha!!");
        // El puerto donde se ejecuta la API (Render lo da en la variable PORT)
        app.listen(entorno.puerto, () => {
            console.log(`NoExitRooms API en http://localhost:${entorno.puerto}/api · documentación en /api/docs`);
        });
    })
    .catch(err => {
        console.error("No se pudo conectar con MongoDB:", err.message);
        process.exit(1);
    });
