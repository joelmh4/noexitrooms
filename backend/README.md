# NoExitRooms · API (backend)

API REST de NoExitRooms hecha con Node, Express y MongoDB (Mongoose), con la misma organización que el ejemplo de clase de la app de coches: `model/`, `controller/`, `routes/`, `middleware/` y `config/`. Es la única parte que habla con la base de datos: el frontend (`../frontend`) solo le hace peticiones HTTP.

Rutas: `/api/health`, Swagger, registro y login con roles (`/api/auth`, `/api/users`), tickets (`/api/tickets`: crear, listar con filtros, responder, notas internas, estados con historial y asignación), categorías (`/api/categories`), CRUD de salas con buscador (`/api/rooms`), reservas con horarios libres (`/api/rooms/:id/slots`, `/api/bookings`) y métricas del panel (`/api/stats`). El despliegue está explicado en [`../docs/despliegue.md`](../docs/despliegue.md).

## Requisitos

- Node 20 o posterior
- MongoDB: en local (MongoDB Community o Docker) o en MongoDB Atlas

## Puesta en marcha

```bash
npm install
cp .env.example .env      # y rellena MONGO_URL, TOKEN_PASSWORD y CORS_ORIGIN
npm run carga             # crea la base de datos con los datos de ejemplo (borra lo que hubiera)
npm run dev               # arranca en http://localhost:3000/api y se reinicia al guardar (nodemon)
```

Documentación de la API: http://localhost:3000/api/docs (también en `/api-docs`, como en el ejemplo de clase).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca con `nodemon` y reinicia al guardar |
| `npm start` | Arranca con `node index.js` (el que usa Render) |
| `npm run carga` | Borra la base de datos del `.env` y la crea con los datos de `bbdd/datos.js` |
| `npm test` | Las 40 pruebas de la API con `node --test` (antes, `npm run carga`) |

## Estructura

```
index.js            arranque: conecta con MongoDB y abre el puerto
app.js              Express: JSON, logger, CORS, Swagger, rutas y errores
config/             variables de entorno, conexión de Mongoose y Swagger (swagger-jsdoc)
model/              esquemas de Mongoose: usuario, sala, categoria, reserva, ticket y contador
controller/         una clase por recurso con la lógica de cada ruta
routes/             rutas por recurso, todas bajo /api, con sus comentarios @swagger
middleware/         verificarToken (401), permitirRoles (403), límite de intentos de login (429), logger y errores
utils/              validación de datos y horarios de las salas
bbdd/               datos de ejemplo y script de carga inicial
tests/              pruebas
```

## La base de datos

Seis colecciones:

| Colección | Qué guarda |
| --- | --- |
| `usuarios` | Nombre, email (único), contraseña con bcrypt (`select: false`), rol y si está activo |
| `salas` | El catálogo de salas (CRUD del administrador) |
| `categorias` | Tipos de ticket |
| `reservas` | Reservas de los clientes. Índice único (`room_id`, `starts_at`): una sala no se reserva dos veces a la misma hora |
| `tickets` | Cada ticket lleva dentro sus `mensajes` y su `historial` de estados (subdocumentos) |
| `contadores` | Un contador por colección para que los ids sean números (`NXR-0004`) |

Las relaciones van con `ref` y se rellenan con `populate()`: por ejemplo, `customer_id` del ticket apunta a `usuario` y `room_id` a `sala`. El modelo completo está en [`../docs/05_Modelo_datos_MongoDB.md`](../docs/05_Modelo_datos_MongoDB.md).

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
- Los filtros siempre se construyen en el servidor con los valores ya validados; el texto de las búsquedas se escapa antes de usarlo en una expresión regular.
- CORS solo deja leer las respuestas al origen de `CORS_ORIGIN`.
- Los errores inesperados se registran en el servidor y al cliente le llega un mensaje sin detalles técnicos.
