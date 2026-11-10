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
| Agente | marta@noexitrooms.test, sergio@noexitrooms.test |
| Cliente | lucia@ejemplo.test, pablo@ejemplo.test, ana@ejemplo.test |

Cualquier cuenta nueva creada desde *Registrarse* es siempre de cliente.

## Qué hace

- **Web pública:** inicio, catálogo de salas con buscador y filtros, ficha de cada sala con galería, sobre nosotros, ayuda con preguntas frecuentes y contacto.
- **Cliente:** registro, inicio y cierre de sesión, perfil editable, reservas, abrir tickets, ver solo los suyos, filtrarlos por estado, responder, confirmar el cierre o pedir la reapertura.
- **Agente:** panel de soporte con sus tickets y los que no tienen agente; responde, escribe notas internas, cambia estado y prioridad.
- **Administrador:** dashboard con métricas, todos los tickets con filtros por cliente, agente, estado y prioridad, asignación de tickets, usuarios y roles, categorías y CRUD de salas.

Los tickets siguen el ciclo Abierto → En curso → Pendiente del cliente → Resuelto → Cerrado, y cada cambio queda en el historial.

## Arquitectura

```
Navegador ──► Web (React + Vite) ──fetch + JWT──► API REST (Node, Express, TypeScript) ──► MySQL
              GitHub Pages                          Render                                    Aiven
```

El frontend nunca habla con la base de datos: todo pasa por la API, que comprueba la sesión, el rol y la propiedad de cada recurso. Ocultar un botón en la web no da ni quita permisos.

| Carpeta | Qué hay |
| --- | --- |
| [`frontend/`](frontend) | Web en React con Vite y React Router. Todas las páginas piden los datos a la API desde `src/api/api.js`. |
| [`backend/`](backend) | API REST con rutas, controladores, servicios y middleware, documentación Swagger y 40 pruebas automáticas. |
| [`docs/`](docs) | Ficha inicial, mapa de páginas, guía de estilo, wireframes, modelo entidad-relación, script SQL, permisos, casos de prueba, capturas y guía de despliegue. |

## Requisitos para ejecutarlo en local

- Node 20 o posterior
- MySQL 8 o MariaDB 10.11

## Instalación en local

1. Crea una base de datos vacía y un usuario con permisos sobre ella.
2. Prepara el backend:

   ```bash
   cd backend
   npm install
   cp .env.example .env     # rellena DB_*, JWT_SECRET y CORS_ORIGIN (la dirección de la web en local: http://localhost:5173)
   npm run db:cargar        # crea las tablas y carga los datos de ejemplo
   npm run dev              # API en http://localhost:3000/api
   ```

3. En otra terminal, arranca la web:

   ```bash
   cd frontend
   npm install
   npm run dev              # web en http://localhost:5173
   ```

   En `localhost` la web usa sola la API local; publicada, usa la de Render. Para usar otra API, copia `frontend/.env.example` como `.env` y cambia `VITE_API_URL`.

## Comandos del backend

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca la API con recarga automática |
| `npm run build` | Compila TypeScript a `dist` |
| `npm start` | Arranca la versión compilada (la de producción) |
| `npm test` | Lanza las 40 pruebas de la API contra la base de datos del `.env` |
| `npm run db:cargar` | Borra y vuelve a crear las tablas con los datos de ejemplo |

## Documentación

- [Permisos por rol](docs/permisos.md)
- [Casos de prueba](docs/casos-de-prueba.md) y [capturas](docs/capturas/)
- [Modelo entidad-relación](docs/05_Modelo_ER.html) y [script SQL](backend/sql/esquema.sql)
- [Wireframes](docs/04_Wireframes.html) y [guía de estilo](docs/03_Guia_de_estilo.html)
- [Despliegue paso a paso](docs/despliegue.md)
- API: Swagger en `/api/docs` y el archivo [`openapi.yaml`](backend/src/docs/openapi.yaml)

## Seguridad

- Contraseñas guardadas con bcrypt; sesión con token JWT que caduca a las 8 horas.
- Todas las consultas a MySQL son parametrizadas y todo texto se escapa antes de pintarlo en la web.
- Diez intentos fallidos de login en 15 minutos bloquean temporalmente ese acceso (429).
- Las claves y la conexión a la base de datos van en variables de entorno; en el repositorio solo está `backend/.env.example`.
