# Casos de prueba

Los casos 01 a 08 son las pruebas de aceptación del enunciado. Se han hecho desde la web, con el navegador (Playwright), contra la API y la base de datos reales; los casos 09 a 14 comprueban la validación y los errores de la API. Las capturas están en [`capturas/`](capturas).

**Entorno de la prueba:** 10 de noviembre de 2026, en local: API con `npm run dev`, MariaDB 10.11 con los datos de `backend/sql/esquema.sql` recién cargados y la web de React con `npm run dev` en `http://localhost:5173`. Las capturas son de la versión anterior de la web (HTML sin framework), con el mismo diseño.

**Pendiente:** repetir los casos 01 a 08 en las URLs públicas cuando estén desplegadas y rellenar la columna de producción.

## Pruebas de aceptación del enunciado

| # | Caso | Pasos | Resultado esperado | Resultado obtenido | Local | Producción |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Un visitante se registra | Registrarse con nombre, email y contraseña. Repetir la petición a `POST /api/auth/register` añadiendo `"role": "admin"` | La cuenta nace con rol Cliente en los dos casos | Las dos cuentas se crean con rol `cliente`; la web lleva a *Mis tickets* | OK | |
| 02 | El cliente abre un ticket y lo consulta | Con la cuenta nueva, *Nuevo ticket*: asunto, categoría, sala, prioridad alta y descripción | El ticket se guarda en estado Abierto, con su código, y aparece en *Mis tickets* | Se crea NXR-0006 en estado Abierto y sale en *Mis tickets* ([captura](capturas/07-mis-tickets.png)) | OK | |
| 03 | El administrador asigna el ticket a un agente | Entrar como `admin@noexitrooms.test`, abrir el ticket y elegir a Marta en *Agente* | El ticket queda asignado a Marta | `agent_id` = 2 (Marta Gil) en la base de datos | OK | |
| 04 | El agente responde y cambia el estado; el cliente ve el historial | Entrar como `marta@noexitrooms.test`, responder y pasar a *Pendiente del cliente*. Entrar después como el cliente | El cliente ve la respuesta, el estado nuevo y el cambio en el historial | El cliente ve el mensaje de Marta, el estado *Pendiente del cliente* y la línea "Marta Gil cambió el estado: Abierto → Pendiente del cliente" ([captura](capturas/12-ticket-cliente.png)) | OK | |
| 05 | Otro cliente intenta ver el ticket | Entrar como `lucia@ejemplo.test` y abrir `/tickets/6` cambiando la URL | Acceso denegado | La API responde **404** y la web muestra "Ese ticket no existe o no tienes acceso" ([captura](capturas/13-ticket-ajeno.png)) | OK | |
| 06 | Un cliente intenta entrar al panel admin | Como Lucía, abrir `/admin` y llamar a la API del panel con su token | El backend lo deniega | `GET /api/stats` **403**, `GET /api/users` **403**, `DELETE /api/rooms/1` **403**; la web muestra "No tienes acceso a esta página con tu cuenta" | OK | |
| 07 | Crear, editar y borrar una sala | Como admin, crear "La cripta del examen", comprobar que sale en el catálogo, editar su dificultad y borrarla | Los cambios se guardan en la base de datos | Creada (sale en el catálogo público), editada a dificultad 5, borrada con **204**; después `GET` da **404** | OK | |
| 08 | Móvil, filtros y búsqueda | Abrir el catálogo en un iPhone 13 (390 px), buscar "david"; abrir el panel del agente | Se ve bien sin scroll horizontal y el buscador filtra | Sin scroll horizontal; el buscador deja "1 sala" (Operación David) ([captura](capturas/15-movil-buscador.png), [panel](capturas/16-movil-panel-agente.png)) | OK | |

## Validación y errores de la API

| # | Caso | Petición | Resultado esperado | Resultado obtenido | Local |
| --- | --- | --- | --- | --- | --- |
| 09 | Datos inválidos | `POST /api/auth/register` con nombre vacío, email "no-es-email" y contraseña "123" | 400 con el error de cada campo | **400** con `campos`: nombre, email y contraseña, cada uno con su mensaje | OK |
| 10 | Email repetido | `POST /api/auth/register` con `lucia@ejemplo.test` | 409 | **409** "Ya existe una cuenta con ese email." | OK |
| 11 | Sin sesión | `GET /api/tickets` sin token | 401 | **401** | OK |
| 12 | Recurso inexistente | `GET /api/tickets/99999` como admin | 404 | **404** | OK |
| 13 | Borrar una sala con tickets o reservas | `DELETE /api/rooms/3` como admin | 409 y la sala se conserva | **409** "La sala tiene tickets o reservas asociados. Desactívala en lugar de borrarla." | OK |
| 14 | Fuerza bruta en el login | 11 intentos seguidos con contraseña incorrecta | A partir del intento 11, 429 | El intento 11 responde **429** | OK |

## Pruebas automáticas

Además, `npm test` en `backend/` lanza 40 pruebas de la API (`backend/tests/`) que cubren registro y login, roles, propiedad de tickets, ciclo de estados, asignación, notas internas, CRUD y búsqueda de salas, reservas y métricas. Resultado el 5 de noviembre de 2026: **40 de 40 correctas**.
