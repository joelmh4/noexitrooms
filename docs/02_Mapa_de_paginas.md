# Mapa de páginas: NoExitRooms

27 oct 2026 · Páginas iniciales de la web, agrupadas por zona. Es la base para los wireframes y el mapa de navegación; se podrán añadir más.
Versión editable: https://claude.ai/artifact/RFQPbKjwppVLqhgVyh1pud

**Resumen:** 20 páginas en 5 zonas: web pública (7), acceso (2), área del cliente (4), panel de soporte (2) y panel de administración (5).

## 1. Web pública (cualquier visitante)

| # | Página | Ruta | Contenido principal |
| --- | --- | --- | --- |
| 1 | Inicio | `/` | Portada con la marca, salas destacadas, cómo funciona (elige sala, reúne a tu grupo, escapa) y llamada a la acción. |
| 2 | Catálogo de salas | `/salas` | Tarjetas de todas las salas activas, buscador por nombre y filtros por temática, dificultad y número de jugadores. Mensaje de "sin resultados". |
| 3 | Ficha de sala | `/salas/:slug` | Imagen, historia, dificultad, duración, jugadores, precio por persona y botón de contacto o reserva. |
| 4 | Sobre nosotros | `/sobre-nosotros` | Quiénes somos, el local, el equipo y explicación del proyecto (requisito "Sobre el proyecto"). |
| 5 | Ayuda / FAQ | `/ayuda` | Preguntas frecuentes (edad mínima, cancelaciones, bonos regalo, accesibilidad) y enlace para abrir un ticket. |
| 6 | Contacto | `/contacto` | Dirección, horario, mapa y acceso al soporte por tickets (pide iniciar sesión). |
| 7 | Página no encontrada | `*` | Error 404 temático ("Esta puerta no lleva a ningún sitio") con enlace a inicio. |

Elementos comunes en todas: **menú de navegación** (cambia según el rol) y **pie** con enlaces, redes y aviso legal.

## 2. Acceso

| # | Página | Ruta | Contenido principal |
| --- | --- | --- | --- |
| 8 | Iniciar sesión | `/login` | Email y contraseña, mensajes de error y enlace a registro. Tras entrar redirige según el rol. |
| 9 | Registro | `/registro` | Nombre, email, contraseña y confirmación. Siempre crea una cuenta de **cliente**. |

## 3. Área del cliente (rol Cliente)

| # | Página | Ruta | Contenido principal |
| --- | --- | --- | --- |
| 10 | Mi perfil | `/mi-cuenta` | Ver y editar nombre y email; cambiar contraseña. |
| 11 | Mis tickets | `/mi-cuenta/tickets` | Listado de sus tickets con código, asunto, estado y fecha; filtro por estado. |
| 12 | Nuevo ticket | `/mi-cuenta/tickets/nuevo` | Formulario: asunto, categoría, prioridad y descripción. |
| 13 | Detalle de ticket | `/mi-cuenta/tickets/:id` | Datos del ticket, historial cronológico de mensajes y cambios de estado, caja para responder, botones de confirmar cierre o pedir reapertura. Solo accesible si el ticket es suyo. |

## 4. Panel de soporte (rol Agente)

| # | Página | Ruta | Contenido principal |
| --- | --- | --- | --- |
| 14 | Mis tickets asignados | `/soporte` | Tickets asignados al agente con filtros por estado y prioridad. |
| 15 | Gestión de ticket | `/soporte/tickets/:id` | Historial, responder al cliente, cambiar estado y prioridad. |

## 5. Panel de administración (rol Admin)

| # | Página | Ruta | Contenido principal |
| --- | --- | --- | --- |
| 16 | Dashboard | `/admin` | Métricas: total de tickets, abiertos, en curso y resueltos/cerrados; lista de tickets sin asignar. |
| 17 | Todos los tickets | `/admin/tickets` | Listado completo con filtros por cliente, agente, estado y prioridad. Desde el detalle (misma vista que la 15) se asigna, reasigna y cierra. |
| 18 | Gestión de salas | `/admin/salas` | Tabla de salas con crear, editar y desactivar o eliminar (CRUD temático). Incluye el formulario de sala. |
| 19 | Gestión de usuarios | `/admin/usuarios` | Listado de usuarios, cambio de rol (cliente, agente, admin) y activar o desactivar cuentas. |
| 20 | Categorías de tickets | `/admin/categorias` | Crear, editar y activar o desactivar categorías. |

## Ampliaciones previstas (más adelante)

- **Mis reservas** (`/mi-cuenta/reservas`) y **reservar sala** desde la ficha, si se hace la mejora de reservas.
- **Gestión de reservas** para el admin (`/admin/reservas`).
- **Valoraciones** de salas en la ficha de detalle.
- **Recuperar contraseña** (`/recuperar`).

## Notas

- La documentación Swagger de la API no es una página del frontend: la sirve el backend (por ejemplo, en `/api/docs`).
- Que una ruta no aparezca en el menú no basta: el backend debe rechazar con 401 o 403 cualquier petición sin sesión o con el rol incorrecto, y con 403 o 404 si un cliente pide un ticket que no es suyo.
