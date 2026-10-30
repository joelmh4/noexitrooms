# NoExitRooms

Web de escape rooms en Madrid con catálogo de salas, reservas y atención al cliente por tickets. Proyecto trimestral de DAW de Joel, Edu e Iván.

| Carpeta | Qué hay |
| --- | --- |
| [`frontend/`](frontend) | Web en HTML, CSS y JavaScript. Habla con la API desde `js/api.js`; sin API configurada funciona en modo demo con datos del navegador. |
| [`backend/`](backend) | API REST en Node, Express y TypeScript sobre MySQL, con documentación Swagger. |
| [`docs/`](docs) | Ficha inicial, mapa de páginas, guía de estilo, wireframes, modelo entidad-relación y script SQL. |

## Arquitectura

Frontend → API (Express) → MySQL. El frontend nunca habla con la base de datos: todo pasa por la API, que comprueba sesión, rol y propiedad de cada recurso.

## Puesta en marcha

- Backend: ver [`backend/README.md`](backend/README.md).
- Frontend: abrir `frontend/index.html` o servir la carpeta con cualquier servidor estático.

## URLs públicas

Pendientes de despliegue. Los pasos están en [`docs/despliegue.md`](docs/despliegue.md): MySQL en Aiven, API en Render (`render.yaml`) y web en GitHub Pages (`.github/workflows/web.yml`).

## Usuarios de prueba (ficticios)

Contraseña de todos: `Demo1234!`

| Rol | Email |
| --- | --- |
| Administrador | admin@noexitrooms.test |
| Agente | marta@noexitrooms.test |
| Cliente | lucia@ejemplo.test |
