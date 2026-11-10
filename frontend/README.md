# NoExitRooms · Frontend

Web en **React** con **Vite** y **React Router**, como en la guía de clase. Tiene las 20 páginas del mapa y todos los datos los pide a la API del backend.

## Cómo arrancarla

```bash
npm install
npm run dev       # http://localhost:5173 (usa la API local http://localhost:3000/api)
npm run build     # versión de producción en dist/ (la que se publica en GitHub Pages)
```

- Publicada: https://joelmh4.github.io/noexitrooms/ (usa la API de Render).
- Cuentas de prueba (contraseña `Demo1234!`): `lucia@ejemplo.test` (cliente), `marta@noexitrooms.test` (agente), `admin@noexitrooms.test` (administrador).

## Estructura

```
index.html                  Página única: React pinta todo dentro de <div id="root">
vite.config.js              Configuración de Vite (base /noexitrooms/ para GitHub Pages)
public/img/                 Logos, iconos y fotos de las salas
src/main.jsx                Punto de entrada: BrowserRouter, AuthProvider, AvisosProvider y los CSS
src/App.jsx                 Todas las rutas, agrupadas por zona (pública, acceso, cliente, agente, admin)
src/api/api.js              Capa de datos: fetch a la API con el token JWT
src/context/AuthContext.jsx Sesión: usuario actual, login, registro y logout
src/context/Avisos.jsx      Avisos flotantes (toast) y diálogo de confirmación
src/components/             Piezas reutilizables: plantillas de cada zona, RutaProtegida, tabla de tickets, historial, reserva…
src/pages/                  Una página por archivo (src/pages/admin/ para el panel del administrador)
src/utils/                  Textos y formatos (estados, fechas, precios) y el hook useDatos para cargar datos
src/css/                    Hojas de estilo de la guía de estilo (estilos, panel, inicio, sala, equipo)
```

### Rutas

| Zona | Rutas | Quién entra |
| --- | --- | --- |
| Pública | `/`, `/salas`, `/salas/:slug`, `/sobre-nosotros`, `/ayuda`, `/contacto` | Todos |
| Acceso | `/login`, `/registro` | Todos |
| Cliente | `/mis-tickets`, `/nuevo-ticket`, `/tickets/:id`, `/perfil` | Cliente |
| Soporte | `/soporte`, `/soporte/tickets/:id` | Agente |
| Admin | `/admin`, `/admin/tickets`, `/admin/tickets/:id`, `/admin/usuarios`, `/admin/salas`, `/admin/categorias` | Administrador |

Cualquier otra ruta muestra la página 404.

## Conexión con el backend

`src/api/api.js` hace `fetch()` a la API con el token en `Authorization: Bearer ...` y convierte los errores del backend (400, 401, 403, 404, 409, 429) en mensajes para la página. Los componentes solo usan `api` y nunca tocan la base de datos.

- La URL de la API sale de la variable de entorno `VITE_API_URL` (archivo `.env`, ver `.env.example`). Si no está, en `localhost` se usa `http://localhost:3000/api` y publicada, la de Render.
- En el navegador solo se guarda la sesión (token y datos del usuario). Al recibir un 401, la sesión se borra y la ruta protegida manda al login.

**Importante:** `RutaProtegida` comprueba el rol solo para que la web se vea bien. La seguridad de verdad la hace el backend (401/403/404).

## Seguridad

- React escapa todo el texto que se pinta con `{…}`, así que los datos no pueden meter HTML (evita XSS). No se usa `dangerouslySetInnerHTML`.
- El cliente nunca ve las notas internas ni tickets de otros clientes: el backend no se los envía.
- Tras el login solo se redirige a rutas de esta web.
