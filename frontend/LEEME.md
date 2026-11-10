# NoExitRooms · Frontend

Web en **HTML, CSS y JavaScript** (sin frameworks). Tiene las 20 páginas del mapa y todos los datos los pide a la API del backend.

## Cómo abrirlo
- Publicada: https://joelmh4.github.io/noexitrooms/ (usa la API de Render).
- En local: arranca el backend (`npm run dev` en `backend/`) y abre `index.html` con la extensión **Live Server** de VS Code. Abierta en `localhost` o `127.0.0.1`, la web usa la API local `http://localhost:3000/api`.
- Cuentas de prueba (contraseña `Demo1234!`): `lucia@ejemplo.test` (cliente), `marta@noexitrooms.test` (agente), `admin@noexitrooms.test` (administrador).

## Estructura
```
css/estilos.css        Hoja de estilos principal (variables de la guía de estilo arriba del todo)
css/panel.css          Paneles de cliente, soporte y admin ("sala de control"): menú lateral, monitores y tablas que pasan a tarjetas en el móvil
css/inicio.css         Portada: foco de luz, frase de entrada, medidor "¿Cuánto aguantáis?", normas y bonos
css/sala.css           Ficha de sala: panel de ambientación, galería, visor de fotos y reserva con calendario
css/equipo.css         Sobre nosotros: fichas del equipo
js/ambiente.js         Texto de ambientación de cada sala (terminal, consola…)
js/inicio-escenas.js   Medidor "¿Cuánto aguantáis?" de la portada (recomienda sala según la dificultad)
js/api.js              Capa de datos: todas las páginas piden los datos aquí
js/ui.js               Utilidades: escapar texto, chips de estado, cabecera, pie, menús y protección por rol
js/paginas/*.js        Un archivo por página
*.html                 Las 20 páginas
img/                   Logo
```
Cada HTML indica su zona y rol en `<body data-zona="..." data-pagina="..." data-rol="...">` y `ui.js` pinta la cabecera, el pie o el menú lateral.

## Conexión con el backend
`js/api.js` hace `fetch()` a la API con el token en `Authorization: Bearer ...` y convierte los errores del backend (400, 401, 403, 404, 409, 429) en mensajes para la página. Las páginas solo usan `api` y nunca tocan la base de datos.

- `API_URL_PUBLICA` es la URL de Render. Si la web se abre en `localhost` o con doble clic, usa `API_URL_LOCAL` (`http://localhost:3000/api`).
- Para probar contra otra API, abre cualquier página con `?api=<url>`; el navegador lo recuerda. Con `?api=publica` vuelve a la normal.
- En el navegador solo se guarda la sesión (token y datos del usuario). Al recibir un 401, la sesión se borra y la página manda al login.

**Importante:** las comprobaciones de rol que hace el navegador son solo para que la web se vea bien. La seguridad de verdad la hace el backend (401/403/404).

## Seguridad ya aplicada
- Todo texto que viene de datos pasa por `esc()` antes de pintarse (evita XSS).
- El cliente nunca ve las notas internas ni tickets de otros clientes.
- Tras el login solo se redirige a páginas de esta web.

## Imágenes (img/)
Recortadas de los logos e ilustraciones del equipo, con fondo transparente. Las que acaban en `-oscuro` tienen el gris aclarado para verse sobre fondo oscuro.
- `logo-candado` → logo de la barra de navegación y del menú lateral
- `logo-cerradura` → logo principal (portada, login, registro y pie)
- `favicon` → la "N" con laberinto
- `iconos/` → los 6 iconos de "Cómo funciona"
- `puerta` → página 404 y "Cerrar sesión"
- `reloj-arena` → indicador de "Cargando…"

## Animaciones
Solo transiciones y animaciones de CSS (`transition`, `@keyframes`), con una curva común `--curva` y una duración `--dur` definidas en las variables de `estilos.css`:
- Botones que se hunden un poco al pulsar y tarjetas que se elevan al pasar el ratón.
- El menú del móvil y el cajón del panel se abren añadiendo una clase (`abierto` / `menu-abierto`) desde JavaScript; el movimiento lo hace la transición de CSS.
- Los avisos flotantes (`toast()` en `ui.js`) aparecen con la clase `visible` y se van solos a los 4 segundos.
- En la portada, un foco de luz sigue al ratón: `inicio.js` guarda la posición en dos variables CSS (`--foco-x`, `--foco-y`) y un `radial-gradient` las usa.
- Si el sistema pide "reducir movimiento", una regla al final de la sección 8 de `estilos.css` desactiva las animaciones.
