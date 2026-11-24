# Despliegue de NoExitRooms

El enunciado pide que la entrega funcione en internet, sin `localhost`, y con la base de datos fuera del ordenador. Así queda:

| Pieza | Dónde | Coste |
| --- | --- | --- |
| Base de datos MongoDB | MongoDB Atlas, cluster M0 gratuito | 0 € |
| API (Node + Express) | Render, servicio web gratuito (`render.yaml`) | 0 € |
| Web (HTML, CSS y JS) | GitHub Pages (`.github/workflows/web.yml`) | 0 € |

```
Navegador ──► https://joelmh4.github.io/noexitrooms/  (GitHub Pages)
     │
     └──fetch──► https://<servicio>.onrender.com/api   (Render)
                        │
                        └──TLS──► MongoDB en Atlas
```

## 1. Base de datos en MongoDB Atlas

1. Crea una cuenta en [mongodb.com/atlas](https://www.mongodb.com/atlas) y, dentro, un cluster **M0** (gratuito) en una región de Europa.
2. En *Database Access* crea un usuario con contraseña, y en *Network Access* permite el acceso desde `0.0.0.0/0` (Render no tiene una IP fija).
3. En *Connect > Drivers* copia la dirección de conexión y añade el nombre de la base de datos, `noexitrooms`, antes de la `?`:

   ```
   MONGO_URL=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/noexitrooms?retryWrites=true&w=majority
   ```

4. Carga las colecciones y los datos de ejemplo desde tu ordenador: pon esa `MONGO_URL` en `backend/.env` y ejecuta `npm run carga` dentro de `backend/`. **Ojo:** borra la base de datos si ya existía; úsalo solo la primera vez o para dejarla como al principio.

## 2. API en Render

1. Crea una cuenta en [render.com](https://render.com) entrando con GitHub.
2. *New > Blueprint* y elige el repositorio `joelmh4/noexitrooms`. Render lee `render.yaml` y prepara el servicio `noexitrooms-api`.
3. Rellena la variable que pide: `MONGO_URL` (la misma del paso 1). `TOKEN_PASSWORD` la genera Render sola y `CORS_ORIGIN` ya apunta a GitHub Pages.
4. Cuando termine, abre `https://<servicio>.onrender.com/api/health`. Debe responder `"baseDeDatos":"ok"`. La documentación queda en `/api/docs`.

> El plan gratuito se duerme tras 15 minutos sin visitas y tarda unos 50 segundos en despertar. Antes de la defensa, abre `/api/health` un par de minutos antes.

## 3. Web en GitHub Pages

1. En GitHub, *Settings > Pages > Build and deployment > Source*: **GitHub Actions**.
2. En la pestaña *Actions*, lanza **Publicar la web** (o haz cualquier cambio en `frontend/`). Después se publica sola con cada cambio en `main`.
3. La web queda en `https://joelmh4.github.io/noexitrooms/`.

## 4. Conectar la web con la API

En `frontend/js/api.js`, `API_URL_PUBLICA` ya apunta a `https://noexitrooms-api.onrender.com/api`, que es la URL que Render da al servicio `noexitrooms-api`. Si Render os da otra (por ejemplo, porque el nombre ya estaba cogido), cambiadla ahí. La web siempre usa la API real: no hay datos de ejemplo en el navegador. Abierta en `localhost` usa el backend local (`http://localhost:3000/api`).

## 5. Comprobación final

Repite en las URLs públicas las pruebas de aceptación 01–08 del enunciado (registro, ticket, asignación, respuesta, ticket ajeno, roles, CRUD de salas y móvil), y pon las dos URLs en el `README.md`.
