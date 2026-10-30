# Despliegue de NoExitRooms

El enunciado pide que la entrega funcione en internet, sin `localhost`, y con la base de datos fuera del ordenador. Así queda:

| Pieza | Dónde | Coste |
| --- | --- | --- |
| Base de datos MySQL | Aiven for MySQL, plan gratuito | 0 € |
| API (Node + Express) | Render, servicio web gratuito (`render.yaml`) | 0 € |
| Web (HTML, CSS y JS) | GitHub Pages (`.github/workflows/web.yml`) | 0 € |

```
Navegador ──► https://joelmh4.github.io/noexitrooms/  (GitHub Pages)
     │
     └──fetch──► https://<servicio>.onrender.com/api   (Render)
                        │
                        └──SSL──► MySQL en Aiven
```

## 1. Base de datos en Aiven

1. Crea una cuenta en [aiven.io](https://aiven.io) y, dentro, un servicio **MySQL** con el plan **Free** en una región de Europa.
2. Cuando esté en marcha, en *Overview > Connection information* apunta: **Host**, **Port**, **User** (`avnadmin`), **Password** y **Database** (`defaultdb`). Descarga también el **CA certificate** (`ca.pem`).
3. Carga las tablas y los datos de ejemplo desde tu ordenador. En `backend/.env` pon los valores de Aiven:

   ```
   DB_HOST=…aivencloud.com
   DB_PORT=…
   DB_USER=avnadmin
   DB_PASSWORD=…
   DB_NAME=defaultdb
   DB_SSL=true
   DB_SSL_CA="-----BEGIN CERTIFICATE-----
   …contenido de ca.pem…
   -----END CERTIFICATE-----"
   ```

   y ejecuta `npm run db:cargar` en `backend/`. Debe decir `6 usuarios de prueba`. **Ojo:** este comando borra y vuelve a crear todas las tablas; úsalo solo para cargarlas la primera vez o para dejar la base como al principio.

## 2. API en Render

1. Crea una cuenta en [render.com](https://render.com) entrando con GitHub.
2. *New > Blueprint* y elige el repositorio `joelmh4/noexitrooms`. Render lee `render.yaml` y prepara el servicio `noexitrooms-api`.
3. Rellena las variables que pide: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_SSL_CA` (el contenido entero de `ca.pem`). `JWT_SECRET` la genera Render sola y `CORS_ORIGIN` ya apunta a GitHub Pages.
4. Cuando termine, abre `https://<servicio>.onrender.com/api/health`. Debe responder `"baseDeDatos":"ok"`. La documentación queda en `/api/docs`.

> El plan gratuito se duerme tras 15 minutos sin visitas y tarda unos 50 segundos en despertar. Antes de la defensa, abre `/api/health` un par de minutos antes.

## 3. Web en GitHub Pages

1. En GitHub, *Settings > Pages > Build and deployment > Source*: **GitHub Actions**.
2. En la pestaña *Actions*, lanza **Publicar la web** (o haz cualquier cambio en `frontend/`). Después se publica sola con cada cambio en `main`.
3. La web queda en `https://joelmh4.github.io/noexitrooms/`.

## 4. Conectar la web con la API

En `frontend/js/api.js`, cambia `API_URL_PUBLICA` por la URL de Render terminada en `/api`. Mientras siga siendo la de ejemplo (`.example`), la web funciona en modo demo con datos del navegador.

## 5. Comprobación final

Repite en las URLs públicas las pruebas de aceptación 01–08 del enunciado (registro, ticket, asignación, respuesta, ticket ajeno, roles, CRUD de salas y móvil), y pon las dos URLs en el `README.md`.
