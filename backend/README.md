# NoExitRooms · Backend (API)

API REST de NoExitRooms hecha con Node.js, Express y MySQL (Sequelize).

## Carpetas

- `index.js` y `app.js`: arranque del servidor
- `config/`: conexión a la base de datos y Swagger
- `model/`: tablas de la base de datos
- `controller/`: lógica de cada ruta
- `routes/`: rutas de la API
- `middleware/`: login (token JWT), roles y errores
- `bbdd/noexitrooms.sql`: crea la base de datos con datos de ejemplo

## Rutas principales

- `/api/auth`: registro e inicio de sesión
- `/api/rooms`: salas (CRUD del administrador)
- `/api/tickets`: tickets, respuestas, estados y asignación
- `/api/bookings`: reservas
- `/api/users`: usuarios
- `/api/docs`: documentación Swagger

## Usuarios de prueba

Contraseña de todos: `Demo1234!`

| Rol | Email |
| --- | --- |
| Administrador | admin@noexitrooms.test |
| Agente | abalos@noexitrooms.test |
| Cliente | pedro@ejemplo.test |
