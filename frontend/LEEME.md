# NoExitRooms · Boceto del frontend

Primer boceto de la web en **HTML, CSS y JavaScript** (sin frameworks). Tiene las 20 páginas del mapa y funciona con datos de ejemplo guardados en el navegador.

## Cómo abrirlo
- Doble clic en `index.html`, o mejor con la extensión **Live Server** de VS Code (clic derecho en `index.html` → *Open with Live Server*).
- Cuentas de prueba (contraseña `Demo1234!`): `lucia@ejemplo.test` (cliente), `marta@noexitrooms.test` (agente), `admin@noexitrooms.test` (administrador). En el login hay botones de acceso rápido.
- En el pie, "Reiniciar datos de demo" deja los datos como al principio.

## Estructura
```
css/estilos.css        Una sola hoja de estilos (variables de la guía de estilo arriba del todo)
js/datos-demo.js       Datos de ejemplo (los mismos que el script SQL)
js/api.js              Capa de datos: todas las páginas piden los datos aquí
js/ui.js               Utilidades: escapar texto, chips de estado, cabecera, pie, menús y protección por rol
js/paginas/*.js        Un archivo por página
*.html                 Las 20 páginas
img/                   Logo
```
Cada HTML indica su zona y rol en `<body data-zona="..." data-pagina="..." data-rol="...">` y `ui.js` pinta la cabecera, el pie o el menú lateral.

## Conexión con el backend
`js/api.js` tiene dos versiones con las mismas funciones: `apiReal` (hace `fetch()` a la API con el token en `Authorization: Bearer ...`) y `apiDemo` (datos de ejemplo en el navegador). Las páginas usan `api` y no saben cuál hay detrás.

- Mientras `API_URL_PUBLICA` sea la de ejemplo (`.example`), la web funciona en modo demo. Al desplegar el backend, se pone ahí su URL (nunca localhost) y ya usa la API real.
- Para probar con el backend en tu ordenador: arranca la API (`npm run dev` en `backend/`, con `CORS_ORIGIN` igual a la dirección de la web) y abre cualquier página con `?api=http://localhost:3000/api`. El navegador lo recuerda. Con `?api=publica` vuelve a la URL normal y con `?api=demo` fuerza los datos de ejemplo.
- Con la API real, el pie no muestra "Reiniciar datos de demo". Las "pruebas" de cada sala solo existen en los datos de ejemplo (la tabla `rooms` no las tiene), así que con la API real no salen en la ficha.

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

## Movimiento y diseño fluido (pautas de diseño de Apple)
`js/movimiento.js` reúne lo que hace que la web se sienta "viva":
- **Muelles (springs)** en vez de animaciones de duración fija. Se configuran como Apple: *respuesta* (0,3–0,4 s) y *amortiguación* (1 = sin rebote, 0,8 = un poco de rebote solo tras un gesto). En CSS están como curvas `--muelle` y `--muelle-rebote`.
- **Se pueden interrumpir:** si abres y cierras el menú del móvil a mitad, vuelve desde donde está, sin saltos.
- **Gestos:** los avisos flotantes se descartan arrastrándolos hacia abajo y el menú del móvil se cierra arrastrándolo hacia arriba. Al soltar se usa la velocidad del dedo para decidir y seguir el movimiento.
- **Respuesta inmediata:** botones y tarjetas reaccionan al pulsar, no al soltar.
- **Materiales:** cabecera translúcida con desenfoque y sombra solo cuando hay contenido debajo.
- **Coherencia espacial:** los diálogos crecen desde el botón que los abre y se van por el mismo camino; el catálogo recoloca las tarjetas al filtrar u ordenar; el mensaje que envías llega desde la caja de respuesta.
- **Accesibilidad:** respeta "reducir movimiento", "reducir transparencia" y "aumentar contraste" del sistema.
