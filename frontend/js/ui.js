/* =====================================================================
   Utilidades de interfaz compartidas por todas las páginas:
   escapar texto, chips de estado y prioridad, avisos, fechas, la
   cabecera, el pie y los menús de cada zona, y la protección por rol.
   ===================================================================== */

const ESTADOS = {
  abierto: "Abierto",
  en_curso: "En curso",
  pendiente_cliente: "Pendiente del cliente",
  resuelto: "Resuelto",
  cerrado: "Cerrado"
};
const PRIORIDADES = { baja: "Baja", media: "Media", alta: "Alta" };
const ROLES = { cliente: "Cliente", agente: "Agente", admin: "Administrador" };
const TEMATICAS = ["Humor", "Terror", "Espionaje", "Aventura", "Misterio", "Ciencia ficción"];
const NIVELES = ["", "Iniciación", "Fácil", "Media", "Difícil", "Experto"];
const INICIO_POR_ROL = { cliente: "mis-tickets.html", agente: "soporte.html", admin: "admin.html" };

/* ---------- Seguridad: escapar todo lo que venga de datos ---------- */
function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Piezas pequeñas ---------- */
function chipEstado(estado) {
  return `<span class="estado estado-${esc(estado)}">${esc(ESTADOS[estado] || estado)}</span>`;
}
function chipPrioridad(prioridad) {
  return `<span class="prioridad prioridad-${esc(prioridad)}"><span class="barras" aria-hidden="true"><i></i><i></i><i></i></span>${esc(PRIORIDADES[prioridad] || prioridad)}</span>`;
}
function puntosDificultad(n) {
  let html = "";
  for (let i = 1; i <= 5; i++) html += `<i${i > n ? ' class="off"' : ""}></i>`;
  return `<span class="dificultad" role="img" aria-label="Dificultad ${n} de 5: ${NIVELES[n]}">${html}</span>`;
}
function aviso(tipo, texto) {
  const etiqueta = { ok: "OK", error: "ERROR", aviso: "AVISO", info: "INFO" }[tipo];
  return `<div class="aviso aviso-${tipo}" role="${tipo === "error" ? "alert" : "status"}"><b>${etiqueta}</b><span>${esc(texto)}</span></div>`;
}
function icono(nombre) {
  return `<i data-lucide="${nombre}" aria-hidden="true"></i>`;
}
function pintarIconos() {
  if (window.lucide) window.lucide.createIcons();
}
function codigoTicket(id) {
  return "NXR-" + String(id).padStart(4, "0");
}
function iniciales(nombre) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
}
function precio(n) {
  return Number(n).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
}
function claseFondo(tematica) {
  return "fondo-" + tematica.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
}
function fecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
function fechaHora(iso) {
  return new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function parametro(nombre) {
  return new URLSearchParams(location.search).get(nombre);
}

/* ---------- Notificación flotante ---------- */
// Entra desde abajo con un muelle, se puede arrastrar hacia abajo para
// descartarla (con la velocidad del gesto) y se va por el mismo camino.
let toastActual = null;
function toast(tipo, texto) {
  toastActual?.quitar(true);
  const caja = document.createElement("div");
  caja.className = "toast";
  caja.innerHTML = aviso(tipo, texto);
  document.body.append(caja);

  const salida = caja.offsetHeight + 40;
  let y = salida;
  const muelle = crearMuelle(y, v => { y = v; caja.style.transform = `translateY(${v}px)`; caja.style.opacity = String(Math.max(0, 1 - v / salida)); });
  muelle.ir(0);

  let temporizador = null;
  const programar = () => { clearTimeout(temporizador); temporizador = setTimeout(() => quitar(), 3500); };
  function quitar(inmediato = false, velocidad = 0) {
    clearTimeout(temporizador);
    if (toastActual?.caja === caja) toastActual = null;
    if (inmediato) { caja.remove(); return; }
    muelle.ir(salida, { velocidad, terminar: () => caja.remove() });
  }
  // Mientras el ratón o el dedo están encima, no se va sola
  caja.addEventListener("pointerenter", () => clearTimeout(temporizador));
  caja.addEventListener("pointerleave", programar);
  arrastrable(caja, {
    eje: "y",
    alEmpezar: () => clearTimeout(temporizador),
    // Hacia abajo sigue al dedo; hacia arriba se resiste como una goma
    alMover: d => muelle.fijar(d >= 0 ? d : goma(d, caja.offsetHeight)),
    alSoltar: v => {
      // Se decide con la proyección del gesto, no solo con dónde se soltó
      if (y + proyectar(v, 0.99) > caja.offsetHeight / 2) quitar(false, v);
      else { muelle.ir(0, { velocidad: v }); programar(); }
    }
  });
  programar();
  toastActual = { caja, quitar };
}

/* ---------- Diálogo de confirmación (devuelve true o false) ---------- */
function confirmar(titulo, texto, textoBoton = "Confirmar", peligro = false) {
  return new Promise(resolver => {
    const dialogo = document.createElement("dialog");
    dialogo.innerHTML = `
      <form method="dialog" class="contenido-dialogo">
        <h3>${esc(titulo)}</h3>
        <p class="texto-suave">${esc(texto)}</p>
        <div class="fila" style="justify-content:flex-end">
          <button class="boton boton-secundario" value="no">Cancelar</button>
          <button class="boton ${peligro ? "boton-peligro" : "boton-primario"}" value="si">${esc(textoBoton)}</button>
        </div>
      </form>`;
    document.body.append(dialogo);
    dialogo.addEventListener("close", () => { resolver(dialogo.returnValue === "si"); dialogo.remove(); });
    dialogo.showModal();
  });
}

/* ---------- Fotos de sala ---------- */
// La principal viene de rooms.image_url; la galería sale del slug (img/salas/<slug>/galeria-1..3.webp).
// Si una foto no existe se quita y queda el fondo de color de la temática.
function fotoSala(s) {
  return s.image_url || `img/salas/${encodeURIComponent(s.slug)}/principal.webp`;
}
function fotosGaleria(s) {
  return [1, 2, 3].map(n => `img/salas/${encodeURIComponent(s.slug)}/galeria-${n}.webp`);
}
const QUITAR_SI_FALTA = `onerror="this.remove()"`;

/* ---------- Tarjeta de sala (inicio y catálogo) ---------- */
function tarjetaSala(s) {
  return `
    <article class="tarjeta-sala" data-clave="${esc(s.slug)}">
      <div class="imagen ${claseFondo(s.theme)}"><img class="foto-sala" src="${esc(fotoSala(s))}" alt="" loading="lazy" ${QUITAR_SI_FALTA}><span class="tema-tag">${esc(s.theme)}</span></div>
      <div class="cuerpo">
        <h3>${esc(s.name)}</h3>
        <p class="lema">${esc(s.tagline)}</p>
        <div class="datos-sala">
          ${puntosDificultad(s.difficulty)}
          <span>${icono("clock")} ${s.duration_min} min</span>
          <span>${icono("users")} ${s.min_players}-${s.max_players}</span>
          ${s.min_age ? `<span>+${s.min_age}</span>` : ""}
        </div>
        <div class="pie-tarjeta">
          <span class="precio">${precio(s.price_per_person)} <small class="texto-suave">/ persona</small></span>
          <a class="boton boton-primario boton-pequeno" href="sala.html?slug=${encodeURIComponent(s.slug)}">Ver sala</a>
        </div>
      </div>
    </article>`;
}

/* ---------- Tabla de tickets (cliente, soporte y admin) ---------- */
function tablaTickets(lista, { enlace, columnas }) {
  if (!lista.length) return `<div class="tabla-envoltorio"><p class="vacio">No hay tickets que coincidan.</p></div>`;
  const cab = {
    codigo: "Código", asunto: "Asunto", cliente: "Cliente", agente: "Agente", categoria: "Categoría",
    estado: "Estado", prioridad: "Prioridad", fecha: "Actualizado"
  };
  const celda = {
    codigo: t => `<td class="codigo-ticket">${codigoTicket(t.id)}</td>`,
    asunto: t => `<td class="celda-principal"><a href="${enlace}?id=${t.id}">${esc(t.subject)}</a><div class="subtexto">${esc(t.categoria)}</div></td>`,
    cliente: t => `<td>${esc(t.cliente.name)}</td>`,
    agente: t => `<td>${t.agente ? esc(t.agente.name) : '<span class="subtexto">Sin asignar</span>'}</td>`,
    categoria: t => `<td>${esc(t.categoria)}</td>`,
    estado: t => `<td>${chipEstado(t.status)}</td>`,
    prioridad: t => `<td>${chipPrioridad(t.priority)}</td>`,
    fecha: t => `<td class="subtexto">${fechaHora(t.updated_at)}</td>`
  };
  return `
    <div class="tabla-envoltorio">
      <table>
        <thead><tr>${columnas.map(c => `<th scope="col">${cab[c]}</th>`).join("")}</tr></thead>
        <tbody>
          ${lista.map(t => `<tr class="clicable" data-href="${enlace}?id=${t.id}">${columnas.map(c => celda[c](t)).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}
// Toda la fila es clicable (además del enlace del asunto, que sirve con teclado)
document.addEventListener("click", e => {
  const fila = e.target.closest("tr.clicable");
  if (fila && !e.target.closest("a, button, select, input")) location.href = fila.dataset.href;
});

/* ---------- Historial de un ticket: mensajes y cambios de estado ---------- */
function historialTicket(ticket, verInternas) {
  const elementos = [
    ...ticket.mensajes.map(m => ({ tipo: "mensaje", fecha: m.created_at, dato: m })),
    ...ticket.historial.map(h => ({ tipo: "evento", fecha: h.changed_at, dato: h }))
  ].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.tipo === "evento" ? 1 : -1));

  return elementos.map(({ tipo, dato }) => {
    if (tipo === "evento") {
      const texto = dato.old_status
        ? `${dato.autor.name} cambió el estado: ${ESTADOS[dato.old_status]} → ${ESTADOS[dato.new_status]}`
        : `${dato.autor.name} abrió el ticket`;
      return `<p class="evento">${esc(texto)} · ${fechaHora(dato.changed_at)}</p>`;
    }
    if (dato.is_internal && !verInternas) return "";
    const delEquipo = dato.autor.role !== "cliente";
    const clase = dato.is_internal ? "mensaje interno" : delEquipo ? "mensaje del-equipo" : "mensaje";
    const rol = dato.is_internal ? "Nota interna" : delEquipo ? "Equipo NoExitRooms" : "Cliente";
    return `
      <div class="${clase}">
        <span class="autor">${esc(dato.autor.name)} <small>${rol} · ${fechaHora(dato.created_at)}</small></span>
        <p>${esc(dato.body).replace(/\n/g, "<br>")}</p>
      </div>`;
  }).join("");
}

/* ---------- Validación de formularios ---------- */
function marcarError(campo, mensaje) {
  const caja = campo.closest(".campo");
  caja.classList.add("con-error");
  let ayuda = caja.querySelector(".ayuda");
  if (!ayuda) { ayuda = document.createElement("span"); ayuda.className = "ayuda"; caja.append(ayuda); }
  if (!ayuda.dataset.original) ayuda.dataset.original = ayuda.textContent;
  ayuda.textContent = mensaje;
  campo.setAttribute("aria-invalid", "true");
}
function limpiarErrores(formulario) {
  formulario.querySelectorAll(".con-error").forEach(caja => {
    caja.classList.remove("con-error");
    const ayuda = caja.querySelector(".ayuda");
    if (ayuda) ayuda.textContent = ayuda.dataset.original || "";
  });
  formulario.querySelectorAll("[aria-invalid]").forEach(c => c.removeAttribute("aria-invalid"));
}
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =====================================================================
   Plantilla: cabecera, pie y menús según <body data-zona data-pagina>
   ===================================================================== */
const MENU_PUBLICO = [
  ["inicio", "index.html", "Inicio"],
  ["salas", "salas.html", "Salas"],
  ["sobre-nosotros", "sobre-nosotros.html", "Sobre nosotros"],
  ["ayuda", "ayuda.html", "Ayuda"],
  ["contacto", "contacto.html", "Contacto"]
];
const MENU_CLIENTE = [
  ["mis-tickets", "mis-tickets.html", "ticket", "Mis tickets"],
  ["nuevo-ticket", "nuevo-ticket.html", "plus", "Nuevo ticket"],
  ["perfil", "perfil.html", "user", "Mi perfil"]
];
const MENU_AGENTE = [
  ["soporte", "soporte.html", "inbox", "Mis tickets"]
];
const MENU_ADMIN = [
  ["admin", "admin.html", "layout-dashboard", "Dashboard"],
  ["admin-tickets", "admin-tickets.html", "ticket", "Tickets"],
  ["admin-salas", "admin-salas.html", "door-closed", "Salas"],
  ["admin-usuarios", "admin-usuarios.html", "users", "Usuarios"],
  ["admin-categorias", "admin-categorias.html", "tags", "Categorías"]
];

// Logo de la barra: el candado horizontal. En fondos oscuros va la versión con el gris aclarado.
const logo = (oscuro) => `<a class="logo" href="index.html"><img src="img/logo-candado${oscuro ? "-oscuro" : ""}.png" alt="" width="36" height="36">NoExit<span>Rooms</span></a>`;
const PUERTA = (oscuro) => `<img class="icono-img" src="img/puerta${oscuro ? "-oscuro" : ""}.png" alt="">`;

function cabeceraPublica(pagina, yo) {
  const acciones = yo
    ? `<a class="usuario-chip" href="${INICIO_POR_ROL[yo.role]}"><span class="avatar">${esc(iniciales(yo.name))}</span><span>${esc(yo.name.split(" ")[0])}</span></a>`
    : `<a class="boton boton-secundario boton-pequeno" href="login.html">Iniciar sesión</a>
       <a class="boton boton-primario boton-pequeno" href="nuevo-ticket.html">Abrir ticket</a>`;
  return `
    <a class="solo-lectores" href="#contenido">Saltar al contenido</a>
    <header class="cabecera">
      <div class="contenedor">
        ${logo(document.body.classList.contains("tema-oscuro"))}
        <button class="boton-menu" aria-expanded="false" aria-controls="menu-principal">${icono("menu")}<span class="solo-lectores">Menú</span></button>
        <nav class="menu-principal" id="menu-principal" aria-label="Principal">
          ${MENU_PUBLICO.map(([id, href, texto]) => `<a href="${href}"${id === pagina ? ' aria-current="page"' : ""}>${texto}</a>`).join("")}
          ${yo ? "" : '<a class="solo-movil" href="login.html">Iniciar sesión</a>'}
        </nav>
        <div class="cabecera-acciones">${acciones}</div>
      </div>
    </header>`;
}

function piePagina() {
  return `
    <footer class="pie">
      <div class="contenedor">
        <div class="pila" style="gap:8px">
          <span class="logo"><img src="img/logo-cerradura-oscuro.png" alt="" width="44" height="44">NoExit<span>Rooms</span></span>
          <small>Calle del Candado 13, Madrid · Proyecto trimestral DAW 2026</small>
          <small>Joel, Edu e Iván</small>
        </div>
        <div class="pila" style="gap:6px">
          <h4>SALAS</h4>
          <a href="salas.html">Catálogo</a>
          <a href="sobre-nosotros.html">Sobre nosotros</a>
        </div>
        <div class="pila" style="gap:6px">
          <h4>SOPORTE</h4>
          <a href="ayuda.html">Ayuda</a>
          <a href="contacto.html">Contacto</a>
          <a href="nuevo-ticket.html">Abrir ticket</a>
        </div>
        ${api.modoDemo ? `
        <div class="pila" style="gap:6px">
          <h4>BOCETO</h4>
          <small>Datos de ejemplo guardados en tu navegador.</small>
          <button class="boton-enlace" id="reiniciar-demo" type="button">Reiniciar datos de demo</button>
        </div>` : ""}
      </div>
    </footer>`;
}

function menuCliente(pagina, yo) {
  return `
    <nav class="menu-cuenta" aria-label="Mi cuenta">
      <div class="tarjeta-usuario"><span class="avatar">${esc(iniciales(yo.name))}</span><span><b>${esc(yo.name)}</b><small>${esc(yo.email)}</small></span></div>
      ${MENU_CLIENTE.map(([id, href, ic, texto]) => `<a href="${href}"${id === pagina ? ' aria-current="page"' : ""}>${icono(ic)}${texto}</a>`).join("")}
      <button class="boton-enlace cerrar-sesion" data-cerrar-sesion type="button">${PUERTA(false)}Cerrar sesión</button>
    </nav>`;
}

// Panel de soporte y admin: la "sala de control" del game master
function menuLateral(pagina, yo) {
  const enlaces = yo.role === "admin" ? MENU_ADMIN : MENU_AGENTE;
  // La gestión de un ticket marca como activa la lista de la que viene
  const activa = pagina === "gestion-ticket" ? (yo.role === "admin" ? "admin-tickets" : "soporte") : pagina;
  return `
    <aside class="menu-lateral" id="menu-lateral" aria-label="Menú del panel">
      <div class="menu-lateral-cabeza">
        ${logo(true)}
        <button class="boton-icono solo-movil-panel" data-cerrar-menu type="button">${icono("x")}<span class="solo-lectores">Cerrar menú</span></button>
      </div>
      <p class="titulo-menu">Sala de control · ${yo.role === "admin" ? "Administración" : "Soporte"}</p>
      <nav class="pila" style="gap:4px" aria-label="Panel">
        ${enlaces.map(([id, href, ic, texto]) => `<a href="${href}" data-menu="${id}"${id === activa ? ' aria-current="page"' : ""}>${icono(ic)}<span>${texto}</span><span class="contador-menu" hidden></span></a>`).join("")}
      </nav>
      <div class="pie-menu">
        <div class="tarjeta-usuario"><span class="avatar">${esc(iniciales(yo.name))}</span><span><b>${esc(yo.name)}</b><small>${ROLES[yo.role]}</small></span></div>
        <a class="enlace-menu" href="index.html">${icono("globe")}Ver la web</a>
        <button class="enlace-menu cerrar-sesion" data-cerrar-sesion type="button">${PUERTA(true)}Cerrar sesión</button>
      </div>
    </aside>
    <div class="velo-menu" data-cerrar-menu></div>`;
}

// Barra superior del panel: dónde estás, si hay conexión con la API y la hora de Madrid
function barraPanel(yo) {
  const seccion = document.querySelector("main h1")?.textContent.trim() || document.title.split(" · ")[0];
  return `
    <div class="barra-panel">
      <button class="boton-icono boton-menu-panel" type="button" aria-expanded="false" aria-controls="menu-lateral">${icono("menu")}<span class="solo-lectores">Menú</span></button>
      <p class="ruta"><span>${yo.role === "admin" ? "Admin" : "Soporte"}</span><span aria-hidden="true">/</span><b>${esc(seccion)}</b></p>
      <p class="estado-sistema"><span class="piloto${api.modoDemo ? " piloto-demo" : ""}" aria-hidden="true"></span>${api.modoDemo ? "Modo demo" : "Conectado"}<time id="reloj-panel"></time></p>
    </div>`;
}
function horaMadrid() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
}

// Números junto al menú: lo que está esperando a alguien del equipo
async function contadoresMenu(yo) {
  try {
    const tickets = await api.tickets.listar();
    const libres = tickets.filter(t => t.agent_id === null && t.status !== "cerrado").length;
    const mios = tickets.filter(t => t.agent_id === yo.id && ["abierto", "en_curso"].includes(t.status)).length;
    const poner = (id, n, titulo) => {
      const el = document.querySelector(`[data-menu="${id}"] .contador-menu`);
      if (!el || !n) return;
      el.hidden = false;
      el.textContent = n;
      el.title = titulo;
    };
    if (yo.role === "admin") poner("admin-tickets", libres, `${libres} sin asignar`);
    else poner("soporte", mios + libres, `${mios} tuyos por atender y ${libres} sin asignar`);
  } catch { /* el menú funciona igual sin los números */ }
}

// En el móvil el menú lateral es un cajón que entra desde la izquierda.
// Como el menú público: se puede interrumpir a medias y cerrar arrastrándolo.
function montarMenuPanel() {
  const capa = document.querySelector(".panel-admin");
  const menu = document.getElementById("menu-lateral");
  const boton = document.querySelector(".boton-menu-panel");
  if (!capa || !menu || !boton) return;
  const esMovil = matchMedia("(max-width: 860px)");
  let progreso = 0;
  const muelle = crearMuelle(0, p => {
    progreso = p;
    if (!esMovil.matches) return;
    menu.style.transform = `translateX(${(Math.min(p, 1) - 1) * 100}%)`;
    capa.style.setProperty("--velo", String(Math.max(0, Math.min(1, p))));
    capa.classList.toggle("menu-abierto", p > 0.01);
  }, MUELLE_CAJON);
  const abrir = (abierto, velocidad) => {
    boton.setAttribute("aria-expanded", abierto);
    muelle.ir(abierto ? 1 : 0, { velocidad, opciones: MUELLE_CAJON });
    if (abierto) menu.querySelector("[aria-current]")?.focus({ preventScroll: true });
  };
  boton.addEventListener("click", () => abrir(true));
  capa.querySelectorAll("[data-cerrar-menu]").forEach(el => el.addEventListener("click", () => abrir(false)));
  addEventListener("keydown", e => { if (e.key === "Escape" && progreso > 0.5) { abrir(false); boton.focus(); } });
  arrastrable(menu, {
    eje: "x",
    alMover: d => muelle.fijar(d <= 0 ? 1 + d / menu.offsetWidth : 1 + goma(d, menu.offsetWidth) / menu.offsetWidth),
    alSoltar: v => abrir(progreso + proyectar(v, 0.99) / menu.offsetWidth > 0.5, v / menu.offsetWidth)
  });
  const reiniciar = () => {
    menu.style.transform = "";
    capa.classList.remove("menu-abierto");
    boton.setAttribute("aria-expanded", "false");
    muelle.fijar(0);
  };
  esMovil.addEventListener("change", reiniciar);
}

// En el móvil las tablas se ven como tarjetas: cada celda lleva el nombre de su columna
function etiquetarTablas(raiz) {
  raiz.querySelectorAll("table").forEach(tabla => {
    const nombres = [...tabla.querySelectorAll("thead th")].map(th => th.textContent.trim());
    tabla.querySelectorAll("tbody tr").forEach(fila => {
      [...fila.children].forEach((celda, i) => { if (nombres[i] && !celda.dataset.etiqueta) celda.dataset.etiqueta = nombres[i]; });
    });
  });
}

// Pinta la estructura y devuelve el usuario (o null). Si la página exige
// un rol y no lo tienes, muestra el aviso y devuelve null.
function montarPagina() {
  const { zona, pagina, rol } = document.body.dataset;
  const yo = api.auth.usuarioActual();
  const main = document.querySelector("main");
  main.id = "contenido";

  // Comprobación de rol en el navegador: solo para la experiencia de uso.
  // La protección de verdad la hace el backend con el token.
  if (rol) {
    if (!yo) {
      location.replace("login.html?volver=" + encodeURIComponent(location.pathname.split("/").pop() + location.search));
      return null;
    }
    if (!rol.split(",").includes(yo.role)) {
      main.innerHTML = `<div class="contenedor seccion pila">${aviso("error", "No tienes acceso a esta página con tu cuenta.")}<a class="boton boton-primario" href="${INICIO_POR_ROL[yo.role]}">Ir a mi inicio</a></div>`;
      main.dataset.bloqueada = "si";
    }
  }

  if (zona === "publica") {
    main.insertAdjacentHTML("beforebegin", cabeceraPublica(pagina, yo));
    main.insertAdjacentHTML("afterend", piePagina());
  } else if (zona === "cliente" && yo) {
    main.insertAdjacentHTML("beforebegin", cabeceraPublica(null, yo));
    const capa = document.createElement("div");
    capa.className = "panel-layout";
    main.replaceWith(capa);
    capa.innerHTML = menuCliente(pagina, yo);
    capa.append(main);
    main.classList.add("contenido-panel");
    capa.insertAdjacentHTML("afterend", piePagina());
  } else if (zona === "panel" && yo && main.dataset.bloqueada) {
    // Sin permiso: ni menú del panel ni barra, solo el aviso con la cabecera normal
    main.insertAdjacentHTML("beforebegin", cabeceraPublica(null, yo));
    main.insertAdjacentHTML("afterend", piePagina());
  } else if (zona === "panel" && yo) {
    const capa = document.createElement("div");
    capa.className = "panel-admin";
    main.replaceWith(capa);
    capa.innerHTML = menuLateral(pagina, yo);
    capa.append(main);
    main.classList.add("contenido-admin");
    main.insertAdjacentHTML("afterbegin", barraPanel(yo));
    const reloj = document.getElementById("reloj-panel");
    const pintarHora = () => { reloj.textContent = horaMadrid(); };
    pintarHora();
    setInterval(pintarHora, 15000);
    montarMenuPanel();
    if (!main.dataset.bloqueada) contadoresMenu(yo);
  }
  if (zona !== "publica") {
    etiquetarTablas(main);
    new MutationObserver(() => etiquetarTablas(main)).observe(main, { childList: true, subtree: true });
  }

  // Eventos comunes
  montarMenuMovil();
  // Borde suave bajo la cabecera solo cuando hay contenido pasando por debajo
  const cabecera = document.querySelector(".cabecera");
  if (cabecera) {
    const revisar = () => cabecera.classList.toggle("desplazada", scrollY > 4);
    addEventListener("scroll", revisar, { passive: true });
    revisar();
  }
  document.querySelectorAll("[data-cerrar-sesion]").forEach(b => b.addEventListener("click", () => {
    api.auth.cerrarSesion();
    location.href = "index.html";
  }));
  document.getElementById("reiniciar-demo")?.addEventListener("click", async () => {
    if (await confirmar("Reiniciar datos de demo", "Se borran los tickets, salas y cuentas que hayas creado en este navegador.", "Reiniciar", true)) {
      api.reiniciarDemo();
      api.auth.cerrarSesion();
      location.href = "index.html";
    }
  });

  pintarIconos();
  return main.dataset.bloqueada ? null : (yo || "invitado");
}

/* ---------- Menú del móvil: baja desde la cabecera con un muelle ---------- */
// Se puede abrir y cerrar a mitad de animación (siempre parte de donde está)
// y cerrar arrastrándolo hacia arriba.
function montarMenuMovil() {
  const boton = document.querySelector(".boton-menu");
  const menu = document.getElementById("menu-principal");
  if (!boton || !menu) return;
  const esMovil = matchMedia("(max-width: 860px)");
  let progreso = 0;
  const muelle = crearMuelle(0, p => {
    progreso = p;
    if (!esMovil.matches) return;
    menu.style.transform = `translateY(${(p - 1) * 24}px)`;
    menu.style.opacity = String(Math.max(0, Math.min(1, p)));
    menu.classList.toggle("abierto", p > 0.01);
  }, MUELLE_CAJON);
  const abrir = (abierto, velocidad) => {
    boton.setAttribute("aria-expanded", abierto);
    muelle.ir(abierto ? 1 : 0, { velocidad, opciones: MUELLE_CAJON });
  };
  boton.addEventListener("click", () => abrir(boton.getAttribute("aria-expanded") !== "true"));
  arrastrable(menu, {
    eje: "y",
    alMover: d => muelle.fijar(d <= 0 ? 1 + d / menu.offsetHeight : 1 + goma(d, menu.offsetHeight) / menu.offsetHeight),
    alSoltar: v => {
      const vel = v / menu.offsetHeight;
      const final = progreso + proyectar(v, 0.99) / menu.offsetHeight;
      abrir(final > 0.5, vel);
    }
  });
  // Al pasar a escritorio el menú vuelve a ser una barra normal
  esMovil.addEventListener("change", () => {
    menu.style.transform = menu.style.opacity = "";
    menu.classList.remove("abierto");
    boton.setAttribute("aria-expanded", "false");
    muelle.fijar(0);
  });
}

// Punto de entrada de cada página: monta la plantilla y ejecuta su código.
// Si la API devuelve un error, lo muestra como aviso en lugar de romper la página.
function iniciar(codigoPagina) {
  const yo = montarPagina();
  if (yo === null) return;
  Promise.resolve(codigoPagina(yo === "invitado" ? null : yo))
    .then(pintarIconos)
    .catch(err => {
      if (err.status === 401) { location.href = "login.html"; return; }
      const main = document.querySelector("main");
      main.insertAdjacentHTML("afterbegin", `<div class="pila">${aviso("error", err.message || "Algo ha fallado. Inténtalo de nuevo.")}</div>`);
      console.error(err);
    });
}
