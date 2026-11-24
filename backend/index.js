// Punto de entrada: conecta con MongoDB y arranca el servidor
const mongoose = require('mongoose');
const app = require('./app');
const entorno = require('./config/entorno');

mongoose.connect(entorno.mongoUrl)
    .then(() => {
        console.log("BBDD en marcha!!");
        // El puerto donde se ejecuta la API (Render lo da en la variable PORT)
        app.listen(entorno.puerto, (err) => {
            //Express 5 pasa aquí el error si el puerto no se puede abrir (por ejemplo, porque ya está ocupado)
            if (err) {
                console.error(`No se pudo abrir el puerto ${entorno.puerto}: ${err.code === "EADDRINUSE" ? "ya lo está usando otro programa (¿otra terminal con la API abierta?)" : err.message}`);
                process.exit(1);
            }
            console.log(`NoExitRooms API en http://localhost:${entorno.puerto}/api · documentación en /api/docs`);
        });
    })
    .catch(err => {
        console.log("Error al conectar con la BBDD:", err.message);
        process.exit(1);
    });
