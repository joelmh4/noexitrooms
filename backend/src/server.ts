// Punto de entrada: arranca el servidor HTTP
import { app } from "./app";
import { entorno } from "./config/entorno";

app.listen(entorno.puerto, () => {
  console.log(`NoExitRooms API en http://localhost:${entorno.puerto}/api · documentación en /api/docs`);
});
