// Punto de entrada: conecta con MySQL y arranca el servidor
const app = require('./app');
const entorno = require('./config/entorno');
const { conectar } = require('./config/db');

conectar()
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
        console.error("No se pudo conectar con MySQL:", err.message);
        process.exit(1);
    });
