# Modelo de datos (MongoDB)

La base de datos es MongoDB y se maneja con Mongoose, como en el ejemplo de clase de la app de coches. Cada colección tiene su esquema en `backend/model/`. Las entidades son las mismas del modelo entidad-relación ([05_Modelo_ER.html](05_Modelo_ER.html)); lo que cambia es cómo se guardan:

- Las **relaciones** entre colecciones se guardan como el id del otro documento con `ref`, y se rellenan al leer con `populate()` (el "join" de Mongoose).
- Los **mensajes** y el **historial de estados** de un ticket ya no son tablas aparte: van dentro del ticket como subdocumentos. Así un ticket se lee y se guarda de una vez, y crear el ticket con su primer mensaje y su primer estado es una sola escritura.
- Los **ids son números** (1, 2, 3…) y no el ObjectId largo de MongoDB, para que los tickets tengan un código corto (`NXR-0004`) y el frontend no cambie. Los da la colección `contadores` con `$inc`, que es atómico.
- `created_at` y `updated_at` los pone Mongoose solo (`timestamps`).

## Colecciones

### usuarios (`model/usuario.model.js`)

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `_id` | Number | |
| `name` | String | obligatorio, 2-100 caracteres |
| `email` | String | obligatorio, **único**, en minúsculas |
| `password` | String | hash bcrypt; `select: false` (no sale en las consultas) |
| `role` | String | `cliente`, `agente` o `admin` (por defecto `cliente`) |
| `is_active` | Boolean | por defecto `true` |
| `created_at`, `updated_at` | Date | automáticos |

### salas (`model/sala.model.js`)

`name` (único), `slug` (único, para la URL), `theme`, `difficulty` (1-5), `duration_min` (15-180), `min_players`, `max_players`, `price_per_person`, `description`, `tagline`, `min_age` (0-99), `challenges` (una prueba por línea), `image_url`, `is_active`, `created_at`, `updated_at`.

Una sala con tickets o reservas no se borra: se desactiva (la API responde 409 si se intenta borrar).

### categorias (`model/categoria.model.js`)

`name` (único) e `is_active`. No se borran: se desactivan.

### reservas (`model/reserva.model.js`)

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `customer_id` | Number, `ref: "usuario"` | obligatorio |
| `room_id` | Number, `ref: "sala"` | obligatorio |
| `starts_at` | String | hora de Madrid `AAAA-MM-DDTHH:MM:SS` |
| `players` | Number | mínimo 1 |
| `status` | String | `pendiente`, `confirmada` o `cancelada` |

Índice **único** (`room_id`, `starts_at`): una sala no puede tener dos reservas a la misma hora.

### tickets (`model/ticket.model.js`)

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `customer_id` | Number, `ref: "usuario"` | obligatorio |
| `agent_id` | Number, `ref: "usuario"` | `null` si no está asignado |
| `category_id` | Number, `ref: "categoria"` | obligatorio |
| `room_id` | Number, `ref: "sala"` | opcional |
| `booking_id` | Number, `ref: "reserva"` | opcional |
| `subject`, `description` | String | obligatorios |
| `priority` | String | `baja`, `media` o `alta` |
| `status` | String | `abierto`, `en_curso`, `pendiente_cliente`, `resuelto` o `cerrado` |
| `closed_at` | Date | cuando se cierra |
| `mensajes` | [subdocumento] | `author_id` (ref usuario), `body`, `is_internal`, `created_at` |
| `historial` | [subdocumento] | `changed_by_id` (ref usuario), `old_status`, `new_status`, `changed_at` |

### contadores (`model/contador.model.js`)

`{ _id: "ticket", seq: 6 }`: el último id usado en cada colección.

## Datos de ejemplo

`npm run carga` (en `backend/`) borra la base de datos del `.env` y la crea con los datos de `backend/bbdd/datos.js`: 6 usuarios de los 3 roles (contraseña `Demo1234!`), las 6 salas, 6 categorías, 7 reservas y 5 tickets con sus mensajes e historial.
