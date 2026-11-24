# NoExitRooms

Web de una empresa de escape rooms en Madrid. Los visitantes ven el catálogo de salas, se registran, reservan una sesión y piden ayuda con tickets de soporte. El equipo de soporte responde los tickets y el administrador gestiona usuarios, salas, categorías y asignaciones.

Proyecto trimestral de DAW de Joel, Edu e Iván.

## URLs públicas

| Parte | URL |
| --- | --- |
| Web | https://joelmh4.github.io/noexitrooms/ |
| API | https://noexitrooms-api.onrender.com/api |
| Documentación de la API (Swagger) | https://noexitrooms-api.onrender.com/api/docs |

La API está en el plan gratuito de Render: si lleva 15 minutos sin uso, la primera petición tarda alrededor de un minuto en responder.

## Usuarios de prueba (ficticios)

Contraseña de todos: `Demo1234!`

| Rol | Email |
| --- | --- |
| Administrador | admin@noexitrooms.test |
| Agente | abalos@noexitrooms.test, ramos@noexitrooms.test |
| Cliente | pedro@ejemplo.test, cristiano@ejemplo.test, rosalia@ejemplo.test, abascal@ejemplo.test |

Cualquier cuenta nueva creada desde *Registrarse* es siempre de cliente.

## Qué hace

- **Web pública:** inicio, catálogo de salas con buscador y filtros, ficha de cada sala con galería, sobre nosotros, ayuda con preguntas frecuentes y contacto.
- **Cliente:** registro, inicio y cierre de sesión, perfil editable, reservas, abrir tickets, ver solo los suyos, filtrarlos por estado, responder, confirmar el cierre o pedir la reapertura.
- **Agente:** panel de soporte con sus tickets y los que no tienen agente; responde, escribe notas internas, cambia estado y prioridad.
- **Administrador:** dashboard con métricas, todos los tickets con filtros por cliente, agente, estado y prioridad, asignación de tickets, usuarios y roles, categorías y CRUD de salas.

Los tickets siguen el ciclo Abierto → En curso → Pendiente del cliente → Resuelto → Cerrado, y cada cambio queda en el historial.

## Arquitectura

```
Navegador ──► Web (HTML, CSS y JS) ──fetch + JWT──► API REST (Node, Express) ──► MongoDB
              GitHub Pages                          Render                       Atlas
```

El frontend nunca habla con la base de datos: todo pasa por la API, que comprueba la sesión, el rol y la propiedad de cada recurso. Ocultar un botón en la web no da ni quita permisos.

| Carpeta | Qué hay |
| --- | --- |
| [`frontend/`](frontend) | Web en HTML, CSS y JavaScript sin frameworks. Todas las páginas piden los datos a la API desde `js/api.js`. |
| [`backend/`](backend) | API REST en Express con Mongoose sobre MongoDB (modelos, controladores, rutas y middleware, como el ejemplo de clase), documentación Swagger y 40 pruebas automáticas. |
| [`docs/`](docs) | Ficha inicial, mapa de páginas, guía de estilo, wireframes, modelo de datos, permisos, casos de prueba, capturas y guía de despliegue. |

## Requisitos para ejecutarlo en local

- Node 20 o posterior
- MongoDB 7 u 8 (en local, o una base de datos gratuita de MongoDB Atlas)
- Un navegador y cualquier servidor estático (por ejemplo, la extensión Live Server de VS Code)

## Instalación en local

1. Arranca MongoDB en tu ordenador (o crea una base de datos en MongoDB Atlas).
2. Prepara el backend:

   ```bash
   cd backend
   npm install
   cp .env.example .env     # rellena MONGO_URL, TOKEN_PASSWORD y CORS_ORIGIN (el ejemplo ya incluye http://localhost:5173)
   npm run carga            # crea la base de datos noexitrooms con los datos de ejemplo
   npm run dev              # API en http://localhost:3000/api
   ```

3. En `frontend/`, `npm install` y `npm start`: abre la web en http://localhost:5173 (también vale Live Server). Cuando la web se abre en `localhost` o `127.0.0.1`, usa sola la API local; publicada, usa la de Render.

## Comandos del backend

| Comando | Qué hace |
| --- | --- |
| `npm run carga` | Borra la base de datos y carga los datos de ejemplo (`bbdd/datos.js`) |
| `npm run dev` | Arranca la API con recarga automática |
| `npm start` | Arranca la API sin recarga (la de producción) |
| `npm test` | Lanza las 40 pruebas de la API contra la base de datos del `.env` |

## Documentación

- [Permisos por rol](docs/permisos.md)
- [Casos de prueba](docs/casos-de-prueba.md) y [capturas](docs/capturas/)
- [Modelo de datos](docs/05_Modelo_ER.html) y [datos de ejemplo](backend/bbdd/datos.js)
- [Wireframes](docs/04_Wireframes.html) y [guía de estilo](docs/03_Guia_de_estilo.html)
- [Despliegue paso a paso](docs/despliegue.md)
- API: Swagger en `/api/docs`, generado con swagger-jsdoc a partir de los comentarios de [`backend/routes/`](backend/routes)

## Seguridad

- Contraseñas guardadas con bcrypt; sesión con token JWT que caduca a las 8 horas.
- Las consultas a MongoDB se hacen con Mongoose y con valores ya validados (los textos de búsqueda se escapan), y todo texto se escapa antes de pintarlo en la web.
- Diez intentos fallidos de login en 15 minutos bloquean temporalmente ese acceso (429).
- Las claves y la conexión a la base de datos van en variables de entorno; en el repositorio solo está `backend/.env.example`.
