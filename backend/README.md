# NoExitRooms · API (backend)

API REST de NoExitRooms hecha con Node, Express y MySQL (con el ORM Sequelize), con la misma organización que el ejemplo de clase de la app de coches: `model/`, `controller/`, `routes/`, `middleware/` y `config/`. Es la única parte que habla con la base de datos: el frontend (`../frontend`) solo le hace peticiones HTTP.

Rutas: `/api/health`, Swagger, registro y login con roles (`/api/auth`, `/api/users`), tickets (`/api/tickets`: crear, listar con filtros, responder, notas internas, estados con historial y asignación), categorías (`/api/categories`), CRUD de salas con buscador (`/api/rooms`), reservas con horarios libres (`/api/rooms/:id/slots`, `/api/bookings`) y métricas del panel (`/api/stats`). El despliegue está explicado en [`../docs/despliegue.md`](../docs/despliegue.md).

## Requisitos

- Node 20 o posterior
- Una base de datos MySQL 8 o MariaDB 10.11, en local o remota (Aiven)

## Puesta en marcha

1. Ejecuta `bbdd/noexitrooms.sql` en MySQL Workbench o phpMyAdmin: crea la base de datos `noexitrooms`, su usuario, las tablas y los datos de ejemplo (si ya existía, la borra y la vuelve a crear).
2. Arranca la API:

```bash
npm install
cp .env.example .env      # con el paso 1 ya valen los valores del ejemplo
npm start                 # http://localhost:3000/api   (npm run dev: se reinicia al guardar)
```

Documentación de la API: http://localhost:3000/api/docs (también en `/api-docs`, como en el ejemplo de clase).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca con `nodemon` y reinicia al guardar |
| `npm start` | Arranca con `node index.js` (el que usa Render) |
| `npm test` | Las 40 pruebas de la API con `node --test` (antes, ejecutar `bbdd/noexitrooms.sql`) |

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
bbdd/               noexitrooms.sql: crea la base de datos, las tablas y los datos de ejemplo
tests/              pruebas
```

## La base de datos

Siete tablas, las mismas del modelo entidad-relación (`../docs/05_Modelo_ER.html`). Cada una tiene su modelo en `model/` y las claves foráneas salen de las relaciones de `model/index.js`:

Las tablas y las columnas tienen nombres en español (`usuarios`, `salas`, `cliente_id`...). En el código y en la API los campos siguen con sus nombres de siempre (`name`, `customer_id`...): cada modelo dice con `field` a qué columna corresponde cada uno, así que la web no ha tenido que cambiar.

| Tabla | Modelo | Claves foráneas |
| --- | --- | --- |
| `usuarios` | `usuario.model.js` | |
| `salas` | `sala.model.js` | |
| `categorias` | `categoria.model.js` | |
| `reservas` | `reserva.model.js` | `cliente_id` → usuarios, `sala_id` → salas. Único (`sala_id`, `fecha_hora`) |
| `tickets` | `ticket.model.js` | `cliente_id`, `agente_id` → usuarios, `categoria_id` → categorias, `sala_id` → salas, `reserva_id` → reservas |
| `mensajes` | `mensaje.model.js` | `ticket_id` → tickets (CASCADE), `autor_id` → usuarios |
| `historial_estados` | `cambioEstado.model.js` | `ticket_id` → tickets (CASCADE), `autor_id` → usuarios |

Las tablas se crean con el script [`bbdd/noexitrooms.sql`](bbdd/noexitrooms.sql), escrito a mano (CREATE TABLE con sus claves primarias, foráneas, UNIQUE y CHECK, e INSERT con los datos de ejemplo). La API no crea ni modifica tablas: los modelos de Sequelize solo describen las que ya existen.

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
