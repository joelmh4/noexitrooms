# Ficha inicial: NoExitRooms

27 oct 2026 · Ficha inicial del apartado 08 del enunciado.

## Título provisional

**NoExitRooms**, plataforma web de reservas y atención al cliente para un local de escape rooms.

**Integrantes:** Joel, Edu e Iván.

## Problema que resuelve y público objetivo

Los locales de escape rooms pequeños suelen gestionar la información de sus salas y las consultas de los clientes por teléfono, WhatsApp o redes sociales, así que las peticiones se pierden y nadie sabe en qué punto está cada una. NoExitRooms reúne en una sola web el catálogo de salas y un sistema de soporte por tickets en el que cada consulta queda registrada, asignada a un empleado y con su historial.

**Público objetivo:** grupos de amigos, familias y empresas (team building) de 16 a 45 años que buscan una experiencia de ocio, y el personal del local que atiende sus consultas.

## Módulo temático (entidad y CRUD)

**Entidad principal: Salas** (`salas`).

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | entero | Clave primaria |
| nombre | texto | Único, p. ej. "La cripta del alquimista" |
| slug | texto | Para la URL de la ficha |
| tematica | texto | Terror, misterio, aventura, ciencia ficción... |
| dificultad | 1 a 5 | Nivel de dificultad |
| duracion_min | entero | Normalmente 60 o 90 |
| jugadores_min / jugadores_max | entero | p. ej. 2 a 6 |
| precio_persona | decimal | Precio orientativo, sin pagos reales |
| descripcion | texto largo | Historia de la sala |
| url_imagen | texto | Portada |
| activa | booleano | Para desactivar en lugar de borrar |
| creado_en / actualizado_en | fecha | Trazabilidad |

**CRUD (solo administrador):** crear sala, listar y ver ficha (público), editar y desactivar o eliminar. **Búsqueda y filtros:** texto por nombre, filtro por temática, dificultad y número de jugadores, y orden por precio o dificultad.

## Tipos de solicitudes que se gestionarán como tickets

Categorías de ticket (`categorias`), administrables por el admin:

- **Reservas y cambios de fecha:** mover o cancelar una partida.
- **Bonos y tarjetas regalo:** canjeo, caducidad o código que no funciona.
- **Grupos y eventos de empresa:** presupuestos para grupos grandes o cumpleaños.
- **Objetos perdidos:** algo olvidado en el local.
- **Reclamaciones sobre la experiencia:** una prueba que falló, la sala estaba en mal estado...
- **Cuenta y acceso:** problemas con el registro o el perfil.

Roles: el **cliente** abre tickets y responde a los suyos; el **agente** es el game master o el personal de recepción que atiende los tickets asignados; el **administrador** es el gerente, que asigna tickets, gestiona salas, usuarios y categorías y ve las métricas.

## Tecnologías previstas

- **Frontend:** HTML, CSS y JavaScript sin frameworks (el enunciado lo permite en el apartado 05). Varias páginas HTML que piden los datos a la API con `fetch` y async/await desde un único archivo (`js/api.js`). Maquetación con CSS propio, Flexbox y Grid, adaptable a móvil. Publicado en GitHub Pages.
- **Diseño (Diseño de Interfaces):** wireframes, sitemap y mockups en Figma, con paleta de color, tipografía e iconografía definidas.
- **Backend:** Node.js + Express en JavaScript, con la estructura del ejemplo de clase de la app de coches (modelos, controladores, rutas y middleware), autenticación con JWT, contraseñas con bcrypt, validación de datos y documentación con Swagger (swagger-jsdoc y swagger-ui-express). Desplegado en Render.
- **Base de datos:** MySQL alojado en Aiven, con claves primarias y foráneas. Desde Express se accede con el ORM Sequelize (modelos con validaciones y relaciones; consultas siempre parametrizadas). Las tablas y los datos de ejemplo se crean con `npm run carga`, y el esquema está también como script SQL.
- **Control de versiones:** Git y GitHub, con carpetas `frontend/` y `backend/` separadas y secretos en variables de entorno.

*Nota: en clase se ha visto React + Vite, pero para la web hemos preferido HTML, CSS y JavaScript sin framework, que el enunciado admite y que podemos explicar línea a línea en la defensa. El backend de los ejemplos de clase es json-server, que sirve para practicar pero no cumple el enunciado (hace falta una base de datos relacional real, contraseñas con hash y permisos en el servidor). Por eso el backend sigue el ejemplo de clase de la app de coches (Express, JWT, bcrypt y Swagger con swagger-jsdoc), pero con MySQL y Sequelize en lugar de MongoDB y Mongoose, porque el enunciado pide una base de datos relacional.*

## Reparto de responsabilidades

Proyecto en equipo de tres personas (Joel, Edu e Iván). No hay reparto fijo: los tres participan en todas las partes (diseño, frontend, backend, base de datos, pruebas, despliegue y documentación). Cada uno trabaja en su propia rama de Git y los cambios se revisan antes de unirlos a `main`.

## Mejora opcional que se intentará implementar

**Reservas de partida** como segunda entidad (`reservas`: cliente, sala, fecha y hora, número de jugadores, estado). El ticket podrá vincularse opcionalmente a una reserva, de modo que el agente vea de qué partida se habla.

Si sobra tiempo: **valoraciones** de las salas por parte de los clientes, o **notas internas** en los tickets visibles solo para agentes y admin.
