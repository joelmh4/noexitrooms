# NoExitRooms · Backend (API)

API REST de NoExitRooms hecha con Node.js, Express y MongoDB (Mongoose).

## Carpetas

- `index.js` y `app.js`: arranque del servidor
- `config/`: variables de entorno y Swagger
- `model/`: colecciones de la base de datos (esquemas de Mongoose)
- `controller/`: lógica de cada ruta
- `routes/`: rutas de la API
- `middleware/`: login (token JWT), roles y errores
- `bbdd/datos.js` y `bbdd/carga-inicial.js`: datos de ejemplo; `npm run carga` crea la base de datos con ellos

## Cómo arrancarla

1. Tener MongoDB arrancado en `mongodb://127.0.0.1:27017` (o una base de datos de MongoDB Atlas).
2. Copiar `.env.example` como `.env`.
3. Instalar, cargar los datos de ejemplo y arrancar:

```
npm install
npm run carga
npm start
```

La API queda en `http://localhost:3000/api`. `npm run carga` borra la base de datos y la deja como al principio.

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
