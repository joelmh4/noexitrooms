# NoExitRooms · API (backend)

API REST de NoExitRooms hecha con Node, Express y TypeScript sobre MySQL. Es la única parte que habla con la base de datos: el frontend (`../frontend`) solo le hace peticiones HTTP.

Rutas: `/api/health`, Swagger, registro y login con roles (`/api/auth`, `/api/users`), tickets (`/api/tickets`: crear, listar con filtros, responder, notas internas, estados con historial y asignación), categorías (`/api/categories`), CRUD de salas con buscador (`/api/rooms`), reservas con horarios libres (`/api/rooms/:id/slots`, `/api/bookings`) y métricas del panel (`/api/stats`). El despliegue en Render está explicado en [`../docs/despliegue.md`](../docs/despliegue.md).

## Requisitos

- Node 20 o posterior
- Una base de datos MySQL 8 o MariaDB 10.11, en local o remota

## Puesta en marcha

```bash
npm install
cp .env.example .env      # y rellena los valores (CORS_ORIGIN = dirección donde abres la web)
npm run db:cargar         # crea las tablas y los datos de ejemplo (borra lo que hubiera)
npm run dev               # arranca en http://localhost:3000/api con recarga automática
```

Documentación de la API: http://localhost:3000/api/docs

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca desde `src` con `tsx` y reinicia al guardar |
| `npm run build` | Compila TypeScript a `dist` con `tsc` |
| `npm start` | Arranca la versión compilada (la que se usa al desplegar) |
| `npm test` | Pruebas de la API con `node --test` (necesitan la base de datos del `.env`) |
| `npm run db:cargar` | Carga `sql/esquema.sql` en la base de datos |

## Estructura

```
src/
  app.ts          Express: JSON, CORS, Swagger, rutas y errores
  server.ts       arranque
  config/         variables de entorno
  db/             pool de MySQL y consultas parametrizadas
  routes/         rutas por módulo, todas bajo /api
  controllers/    reciben la petición y responden
  services/       reglas de negocio
  middleware/     autenticar (401), permitir por rol (403), límite de intentos de login (429) y errores
  models/         tipos del dominio (Usuario, Sala, Ticket...)
  docs/           openapi.yaml
sql/esquema.sql   tablas y datos de ejemplo
tests/            pruebas
```

## Usuarios de prueba

Todos con la contraseña `Demo1234!` (en la base de datos solo está su hash bcrypt):

| Rol | Email |
| --- | --- |
| Administrador | admin@noexitrooms.test |
| Agente | marta@noexitrooms.test, sergio@noexitrooms.test |
| Cliente | lucia@ejemplo.test, pablo@ejemplo.test, ana@ejemplo.test |

## Seguridad

- El `.env` no se sube nunca (está en `.gitignore`); en el repositorio solo va `.env.example`.
- Todas las consultas usan parámetros (`?`), nunca texto concatenado.
- CORS solo deja leer las respuestas al origen de `CORS_ORIGIN`.
- Los errores inesperados se registran en el servidor y al cliente le llega un mensaje sin detalles técnicos.
