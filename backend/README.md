# NoExitRooms · API (backend)

API REST de NoExitRooms hecha con Node, Express y MySQL (con el ORM Sequelize), con la misma organización que el ejemplo de clase de la app de coches: `model/`, `controller/`, `routes/`, `middleware/` y `config/`. Es la única parte que habla con la base de datos: el frontend (`../frontend`) solo le hace peticiones HTTP.

Rutas: `/api/health`, Swagger, registro y login con roles (`/api/auth`, `/api/users`), tickets (`/api/tickets`: crear, listar con filtros, responder, notas internas, estados con historial y asignación), categorías (`/api/categories`), CRUD de salas con buscador (`/api/rooms`), reservas con horarios libres (`/api/rooms/:id/slots`, `/api/bookings`) y métricas del panel (`/api/stats`). El despliegue está explicado en [`../docs/despliegue.md`](../docs/despliegue.md).

## Requisitos

- Node 20 o posterior
- Una base de datos MySQL 8 o MariaDB 10.11, en local o remota (Aiven)

## Puesta en marcha

```bash
npm install
cp .env.example .env      # y rellena DB_*, TOKEN_PASSWORD y CORS_ORIGIN
npm run carga             # crea las tablas con los datos de ejemplo (borra lo que hubiera)
npm run dev               # arranca en http://localhost:3000/api y se reinicia al guardar (nodemon)
```

Documentación de la API: http://localhost:3000/api/docs (también en `/api-docs`, como en el ejemplo de clase).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca con `nodemon` y reinicia al guardar |
| `npm start` | Arranca con `node index.js` (el que usa Render) |
| `npm run carga` | Borra y crea las tablas en la base de datos del `.env` con los datos de `bbdd/datos.js` |
| `npm test` | Las 40 pruebas de la API con `node --test` (antes, `npm run carga`) |

## Estructura

```
index.js            arranque: conecta con MySQL y abre el puerto
app.js              Express: JSON, logger, CORS, Swagger, rutas y errores
config/             variables de entorno, conexión de Sequelize y Swagger (swagger-jsdoc)
model/              modelos de Sequelize (una tabla cada uno) y sus relaciones en model/index.js
controller/         una clase por recurso con la lógica de cada ruta
routes/             rutas por recurso, todas bajo /api, con sus comentarios @swagger
middleware/         verificarToken (401), permitirRoles (403), límite de intentos de login (429), logger y errores
utils/              validación de datos y horarios de las salas
bbdd/               datos de ejemplo y script de carga inicial
tests/              pruebas
```

## La base de datos

Siete tablas, las mismas del modelo entidad-relación (`../docs/05_Modelo_ER.html`). Cada una tiene su modelo en `model/` y las claves foráneas salen de las relaciones de `model/index.js`:

| Tabla | Modelo | Claves foráneas |
| --- | --- | --- |
| `users` | `usuario.model.js` | |
| `rooms` | `sala.model.js` | |
| `ticket_categories` | `categoria.model.js` | |
| `bookings` | `reserva.model.js` | `customer_id` → users, `room_id` → rooms. Único (`room_id`, `starts_at`) |
| `tickets` | `ticket.model.js` | `customer_id`, `agent_id` → users, `category_id` → ticket_categories, `room_id` → rooms, `booking_id` → bookings |
| `ticket_messages` | `mensaje.model.js` | `ticket_id` → tickets (CASCADE), `author_id` → users |
| `ticket_status_history` | `cambioEstado.model.js` | `ticket_id` → tickets (CASCADE), `changed_by_id` → users |

`npm run carga` crea las tablas desde los modelos (`sequelize.sync`). El mismo esquema, escrito a mano, está en [`../docs/05_esquema_mysql.sql`](../docs/05_esquema_mysql.sql): la API funciona igual con cualquiera de los dos.

Los cambios que van juntos (crear un ticket con su primer mensaje y su estado, cambiar el estado y guardar el historial) se hacen en una transacción: o se guardan todos o ninguno.

## Usuarios de prueba

Todos con la contraseña `Demo1234!` (en la base de datos solo está su hash bcrypt):

| Rol | Email |
| --- | --- |
| Administrador | admin@noexitrooms.test |
| Agente | marta@noexitrooms.test, sergio@noexitrooms.test |
| Cliente | lucia@ejemplo.test, pablo@ejemplo.test, ana@ejemplo.test |

## Seguridad

- El `.env` no se sube nunca (está en `.gitignore`); en el repositorio solo va `.env.example`.
- Contraseñas con bcrypt y sesión con token JWT. En cada petición se vuelve a leer el usuario: si un admin lo desactiva o le cambia el rol, cuenta al momento.
- Los permisos se comprueban en el servidor: `permitirRoles` en las rutas y, en los tickets, la propiedad de cada uno (un ticket ajeno responde 404).
- Todas las consultas van parametrizadas (Sequelize manda los valores aparte del SQL): no hay inyección SQL.
- CORS solo deja leer las respuestas al origen de `CORS_ORIGIN`.
- Los errores inesperados se registran en el servidor y al cliente le llega un mensaje sin detalles técnicos.
