# Ficha inicial: NoExitRooms

27 oct 2026 · Ficha inicial del apartado 08 del enunciado.
Versión editable: https://claude.ai/artifact/MbVryRpd1ZuzDNvhBSub8U

## Título provisional

**NoExitRooms**, plataforma web de reservas y atención al cliente para un local de escape rooms.

**Integrantes:** Joel, Edu e Iván.

## Problema que resuelve y público objetivo

Los locales de escape rooms pequeños suelen gestionar la información de sus salas y las consultas de los clientes por teléfono, WhatsApp o redes sociales, así que las peticiones se pierden y nadie sabe en qué punto está cada una. NoExitRooms reúne en una sola web el catálogo de salas y un sistema de soporte por tickets en el que cada consulta queda registrada, asignada a un empleado y con su historial.

**Público objetivo:** grupos de amigos, familias y empresas (team building) de 16 a 45 años que buscan una experiencia de ocio, y el personal del local que atiende sus consultas.

## Módulo temático (entidad y CRUD)

**Entidad principal: Salas** (`rooms`).

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | entero | Clave primaria |
| name | texto | Único, p. ej. "La cripta del alquimista" |
| slug | texto | Para la URL de la ficha |
| theme | texto | Terror, misterio, aventura, ciencia ficción... |
| difficulty | 1 a 5 | Nivel de dificultad |
| duration_min | entero | Normalmente 60 o 90 |
| min_players / max_players | entero | p. ej. 2 a 6 |
| price_per_person | decimal | Precio orientativo, sin pagos reales |
| description | texto largo | Historia de la sala |
| image_url | texto | Portada |
| is_active | booleano | Para desactivar en lugar de borrar |
| created_at / updated_at | fecha | Trazabilidad |

**CRUD (solo administrador):** crear sala, listar y ver ficha (público), editar y desactivar o eliminar. **Búsqueda y filtros:** texto por nombre, filtro por temática, dificultad y número de jugadores, y orden por precio o dificultad.

## Tipos de solicitudes que se gestionarán como tickets

Categorías de ticket (`ticket_categories`), administrables por el admin:

- **Reservas y cambios de fecha:** mover o cancelar una partida.
- **Bonos y tarjetas regalo:** canjeo, caducidad o código que no funciona.
- **Grupos y eventos de empresa:** presupuestos para grupos grandes o cumpleaños.
- **Objetos perdidos:** algo olvidado en el local.
- **Reclamaciones sobre la experiencia:** una prueba que falló, la sala estaba en mal estado...
- **Cuenta y acceso:** problemas con el registro o el perfil.

Roles: el **cliente** abre tickets y responde a los suyos; el **agente** es el game master o el personal de recepción que atiende los tickets asignados; el **administrador** es el gerente, que asigna tickets, gestiona salas, usuarios y categorías y ve las métricas.

## Tecnologías previstas

- **Frontend (material de clase):** React + Vite con TypeScript (Tema 3), React Router para la navegación y peticiones a la API con `fetch` y async/await. Maquetación con CSS propio, Flexbox y Grid, adaptable a móvil. Desplegado en Vercel o Netlify.
- **Diseño (Diseño de Interfaces):** wireframes, sitemap y mockups en Figma, con paleta de color, tipografía e iconografía definidas.
- **Backend:** Node.js + Express + TypeScript, autenticación con JWT, contraseñas con bcrypt, validación de datos y documentación con Swagger (swagger-ui-express). Desplegado en Render o Railway.
- **Base de datos:** MySQL alojado en un servicio remoto (por ejemplo Railway o Aiven), con script SQL de creación, claves primarias y foráneas, y datos semilla. Desde Express se accede con consultas parametrizadas (mysql2) o con un ORM como Prisma.
- **Control de versiones:** Git y GitHub, con carpetas `frontend/` y `backend/` separadas y secretos en variables de entorno.

*Nota: el material de la biblioteca solo cubre el frontend (React, Vite, TypeScript, fetch) y el diseño (Figma, CSS). El backend de los ejemplos de clase es json-server, que sirve para practicar pero no cumple el enunciado (hace falta una base de datos relacional real, contraseñas con hash y permisos en el servidor). Por eso se propone Express + MySQL, que usa el mismo Node.js y TypeScript vistos en clase. Si el docente indica otro backend, se cambia aquí.*

## Reparto de responsabilidades

Proyecto en equipo de tres personas (Joel, Edu e Iván). No hay reparto fijo: los tres participan en todas las partes (diseño, frontend, backend, base de datos, pruebas, despliegue y documentación). Cada uno trabaja en su propia rama de Git y los cambios se revisan antes de unirlos a `main`.

## Mejora opcional que se intentará implementar

**Reservas de partida** como segunda entidad (`bookings`: cliente, sala, fecha y hora, número de jugadores, estado). El ticket podrá vincularse opcionalmente a una reserva, de modo que el agente vea de qué partida se habla.

Si sobra tiempo: **valoraciones** de las salas por parte de los clientes, o **notas internas** en los tickets visibles solo para agentes y admin.
