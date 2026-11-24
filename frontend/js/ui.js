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
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QUITAR_SI_FALTA = `onerror="this.remove()"`;
const COLUMNA_ACCIONES = `<span class="solo-lectores">Acciones</span>`;

function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
function fechaIso(d = new Date()) {
  return d.toLocaleDateString("sv-SE");
}
function ahoraIso() {
  return new Date().toLocaleString("sv-SE").replace(" ", "T").slice(0, 16);
}
function horaMadrid() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
}
function parametro(nombre) {
  return new URLSearchParams(location.search).get(nombre);
}
function claveValida(clave) {
  return clave.length >= 8 && /\d/.test(clave);
}

function icono(nombre) {
  return `<i data-lucide="${nombre}" aria-hidden="true"></i>`;
}
function aviso(tipo, texto) {
  const etiqueta = { ok: "OK", error: "ERROR", aviso: "AVISO", info: "INFO" }[tipo];
  return `<div class="aviso aviso-${tipo}" role="${tipo === "error" ? "alert" : "status"}"><b>${etiqueta}</b><span>${esc(texto)}</span></div>`;
}
function chipEstado(estado) {
  return `<span class="estado estado-${esc(estado)}">${esc(ESTADOS[estado] || estado)}</span>`;
}
function chipPrioridad(prioridad) {
  return `<span class="prioridad prioridad-${esc(prioridad)}"><span class="barras" aria-hidden="true"><i></i><i></i><i></i></span>${esc(PRIORIDADES[prioridad] || prioridad)}</span>`;
}
function puntosDificultad(n) {
  const puntos = [1, 2, 3, 4, 5].map(i => `<i${i > n ? ' class="off"' : ""}></i>`).join("");
  return `<span class="dificultad" role="img" aria-label="Dificultad ${n} de 5: ${NIVELES[n]}">${puntos}</span>`;
}
function pastilla(activa, texto) {
  return `<span class="pastilla ${activa ? "pastilla-activa" : "pastilla-inactiva"}">${texto}</span>`;
}
function opciones(pares, vacio = null, elegido = null) {
  const todas = vacio === null ? pares : [["", vacio], ...pares];
  return todas.map(([valor, texto]) =>
    `<option value="${esc(valor)}"${String(valor) === String(elegido) ? " selected" : ""}>${esc(texto)}</option>`).join("");
}
function tabla(cabeceras, filas) {
  return `
    <div class="tabla-envoltorio">
      <table>
        <thead><tr>${cabeceras.map(c => `<th scope="col">${c}</th>`).join("")}</tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}

function fotoSala(s) {
  return s.image_url || `img/salas/${encodeURIComponent(s.slug)}/principal.webp`;
}
function fotosGaleria(s) {
  return [1, 2, 3].map(n => `img/salas/${encodeURIComponent(s.slug)}/galeria-${n}.webp`);
}
function tarjetaSala(s) {
  return `
    <article class="tarjeta-sala ${claseFondo(s.theme)}" data-clave="${esc(s.slug)}">
      <div class="imagen"><img class="foto-sala" src="${esc(fotoSala(s))}" alt="" loading="lazy" ${QUITAR_SI_FALTA}><span class="tema-tag">${esc(s.theme)}</span></div>
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

function tablaTickets(lista, { enlace, columnas }) {
  if (!lista.length) return `<div class="tabla-envoltorio"><p class="vacio">No hay tickets que coincidan.</p></div>`;
  const cabecera = {
    codigo: "Código", asunto: "Asunto", cliente: "Cliente", agente: "Agente", categoria: "Categoría",
    estado: "Estado", prioridad: "Prioridad", fecha: "Actualizado"
  };
  const celda = {
    codigo: t => [`class="codigo-ticket"`, codigoTicket(t.id)],
    asunto: t => [`class="celda-principal"`, `<a href="${enlace}?id=${t.id}">${esc(t.subject)}</a><div class="subtexto">${esc(t.categoria)}</div>`],
    cliente: t => ["", esc(t.cliente.name)],
    agente: t => ["", t.agente ? esc(t.agente.name) : '<span class="subtexto">Sin asignar</span>'],
    categoria: t => ["", esc(t.categoria)],
    estado: t => ["", chipEstado(t.status)],
    prioridad: t => ["", chipPrioridad(t.priority)],
    fecha: t => [`class="subtexto"`, fechaHora(t.updated_at)]
  };
  const filas = lista.map(t => `<tr class="clicable" data-href="${enlace}?id=${t.id}">${columnas.map(c => {
    const [atributos, contenido] = celda[c](t);
    return `<td data-etiqueta="${cabecera[c]}" ${atributos}>${contenido}</td>`;
  }).join("")}</tr>`).join("");
  return tabla(columnas.map(c => cabecera[c]), filas);
}

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

function pintarIconos() {
  if (window.lucide) window.lucide.createIcons();
}

let toastActual = null;
function toast(tipo, texto) {
  toastActual?.remove();
  const caja = document.createElement("div");
  caja.className = "toast";
  caja.innerHTML = `${aviso(tipo, texto)}<button class="toast-cerrar" type="button" aria-label="Cerrar aviso">×</button>`;
  document.body.append(caja);
  toastActual = caja;
  setTimeout(() => caja.classList.add("visible"), 10);
  const quitar = () => {
    caja.classList.remove("visible");
    setTimeout(() => caja.remove(), 300);
  };
  caja.querySelector(".toast-cerrar").addEventListener("click", quitar);
  setTimeout(quitar, 4000);
}

async function accion(boton, funcion) {
  if (boton) boton.disabled = true;
  try {
    await funcion();
    return true;
  } catch (err) {
    toast("error", err.message);
    return false;
  } finally {
    if (boton) boton.disabled = false;
  }
}

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
function validar(formulario, reglas) {
  limpiarErrores(formulario);
  const fallos = reglas.filter(([falla]) => falla);
  fallos.forEach(([, campo, mensaje]) => marcarError(campo, mensaje));
  return !fallos.length;
}

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
  ["admin-reservas", "admin-reservas.html", "calendar-check", "Reservas"],
  ["admin-usuarios", "admin-usuarios.html", "users", "Usuarios"],
  ["admin-categorias", "admin-categorias.html", "tags", "Categorías"]
];

const logo = oscuro => `<a class="logo" href="index.html"><img src="img/logo-candado${oscuro ? "-oscuro" : ""}.png" alt="" width="36" height="36">NoExit<span>Rooms</span></a>`;
const puerta = oscuro => `<img class="icono-img" src="img/puerta${oscuro ? "-oscuro" : ""}.png" alt="">`;
const actual = (id, pagina) => id === pagina ? ' aria-current="page"' : "";

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
          ${MENU_PUBLICO.map(([id, href, texto]) => `<a href="${href}"${actual(id, pagina)}>${texto}</a>`).join("")}
          ${yo ? "" : '<a class="solo-movil" href="login.html">Iniciar sesión</a>'}
        </nav>
        <div class="cabecera-acciones">${acciones}</div>
      </div>
    </header>`;
}

function piePagina(conLlamada = false) {
  const dia = new Date().getDay();
  const cierre = dia >= 1 && dia <= 4 ? "a las 23:00" : "a la 01:00";
  return `
    <footer class="pie">
      ${conLlamada ? `
      <div class="pie-llamada">
        <div class="contenedor">
          <div class="pila" style="gap:6px">
            <span class="pie-piloto"><span class="piloto-pie" aria-hidden="true"></span>Hoy cerramos ${cierre}</span>
            <p class="pie-frase">Elegid sala antes de que se apague la luz.</p>
          </div>
          <a class="boton boton-primario" href="salas.html">Ver las salas</a>
        </div>
      </div>` : ""}
      <div class="contenedor pie-columnas">
        <div class="pila pie-marca" style="gap:10px">
          <span class="logo"><img src="img/logo-cerradura-oscuro.png" alt="" width="44" height="44">NoExit<span>Rooms</span></span>
          <small>Escape rooms en Madrid. Seis salas, una salida.</small>
        </div>
        <div class="pila" style="gap:6px">
          <h4>VISÍTANOS</h4>
          <small>Calle del Candado 13, 28012 Madrid</small>
          <small>Metro Tirso de Molina (L1)</small>
          <small>L a J: 16:00 a 23:00</small>
          <small>V a D: 10:00 a 01:00</small>
        </div>
        <div class="pila" style="gap:6px">
          <h4>SALAS</h4>
          <a href="salas.html">Catálogo</a>
          <a href="nuevo-ticket.html?regalo=1">Bonos regalo</a>
          <a href="sobre-nosotros.html">Sobre nosotros</a>
        </div>
        <div class="pila" style="gap:6px">
          <h4>SOPORTE</h4>
          <a href="ayuda.html">Ayuda</a>
          <a href="contacto.html">Contacto</a>
          <a href="nuevo-ticket.html">Abrir ticket</a>
        </div>
      </div>
      <div class="contenedor pie-final">
        <small>© ${new Date().getFullYear()} NoExitRooms · Hecho por Joel, Edu e Iván</small>
        <small class="pie-salida">La salida de emergencia siempre está abierta.</small>
      </div>
    </footer>`;
}

function menuCliente(pagina, yo) {
  return `
    <nav class="menu-cuenta" aria-label="Mi cuenta">
      <div class="tarjeta-usuario"><span class="avatar">${esc(iniciales(yo.name))}</span><span><b>${esc(yo.name)}</b><small>${esc(yo.email)}</small></span></div>
      ${MENU_CLIENTE.map(([id, href, ic, texto]) => `<a href="${href}"${actual(id, pagina)}>${icono(ic)}${texto}</a>`).join("")}
      <button class="boton-enlace cerrar-sesion" data-cerrar-sesion type="button">${puerta(false)}Cerrar sesión</button>
    </nav>`;
}

function menuLateral(pagina, yo) {
  const esAdmin = yo.role === "admin";
  const activa = ["gestion-ticket", "nuevo-ticket"].includes(pagina) ? (esAdmin ? "admin-tickets" : "soporte") : pagina;
  return `
    <aside class="menu-lateral" id="menu-lateral" aria-label="Menú del panel">
      <div class="menu-lateral-cabeza">
        ${logo(true)}
        <button class="boton-icono solo-movil-panel" data-cerrar-menu type="button">${icono("x")}<span class="solo-lectores">Cerrar menú</span></button>
      </div>
      <p class="titulo-menu">Sala de control · ${esAdmin ? "Administración" : "Soporte"}</p>
      <nav class="pila" style="gap:4px" aria-label="Panel">
        ${(esAdmin ? MENU_ADMIN : MENU_AGENTE).map(([id, href, ic, texto]) => `<a href="${href}" data-menu="${id}"${actual(id, activa)}>${icono(ic)}<span>${texto}</span><span class="contador-menu" hidden></span></a>`).join("")}
      </nav>
      <div class="pie-menu">
        <div class="tarjeta-usuario"><span class="avatar">${esc(iniciales(yo.name))}</span><span><b>${esc(yo.name)}</b><small>${ROLES[yo.role]}</small></span></div>
        <a class="enlace-menu" href="index.html">${icono("globe")}Ver la web</a>
        <button class="enlace-menu cerrar-sesion" data-cerrar-sesion type="button">${puerta(true)}Cerrar sesión</button>
      </div>
    </aside>
    <div class="velo-menu" data-cerrar-menu></div>`;
}

function barraPanel(yo) {
  const seccion = document.querySelector("main h1")?.textContent.trim() || document.title.split(" · ")[0];
  return `
    <div class="barra-panel">
      <button class="boton-icono boton-menu-panel" type="button" aria-expanded="false" aria-controls="menu-lateral">${icono("menu")}<span class="solo-lectores">Menú</span></button>
      <p class="ruta"><span>${yo.role === "admin" ? "Admin" : "Soporte"}</span><span aria-hidden="true">/</span><b>${esc(seccion)}</b></p>
      <p class="estado-sistema"><span class="piloto" aria-hidden="true"></span>Conectado<time id="reloj-panel"></time></p>
    </div>`;
}

async function contadoresMenu(yo) {
  try {
    const tickets = await api.tickets.listar();
    const poner = (id, n, titulo) => {
      const el = document.querySelector(`[data-menu="${id}"] .contador-menu`);
      if (!el || !n) return;
      el.hidden = false;
      el.textContent = n;
      el.title = titulo;
    };
    if (yo.role === "admin") {
      const libres = tickets.filter(t => t.agent_id === null && t.status !== "cerrado").length;
      poner("admin-tickets", libres, `${libres} sin asignar`);
      const reservas = await api.reservas.listar();
      const porConfirmar = reservas.filter(r => r.status === "pendiente" && r.starts_at.slice(0, 10) >= fechaIso()).length;
      poner("admin-reservas", porConfirmar, `${porConfirmar} por confirmar`);
    } else {
      const mios = tickets.filter(t => t.agent_id === yo.id && ["abierto", "en_curso"].includes(t.status)).length;
      poner("soporte", mios, `${mios} tuyos por atender`);
    }
  } catch { }
}

function montarMenuPanel() {
  const capa = document.querySelector(".panel-admin");
  const boton = document.querySelector(".boton-menu-panel");
  if (!capa || !boton) return;
  const abrir = abierto => {
    capa.classList.toggle("menu-abierto", abierto);
    boton.setAttribute("aria-expanded", abierto);
  };
  boton.addEventListener("click", () => abrir(true));
  capa.querySelectorAll("[data-cerrar-menu]").forEach(el => el.addEventListener("click", () => abrir(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") abrir(false); });
}

function montarMenuMovil() {
  const boton = document.querySelector(".boton-menu");
  const menu = document.getElementById("menu-principal");
  if (!boton || !menu) return;
  boton.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto);
  });
}

function envolver(main, clase, menu) {
  const capa = document.createElement("div");
  capa.className = clase;
  main.replaceWith(capa);
  capa.innerHTML = menu;
  capa.append(main);
  return capa;
}

function montarPagina() {
  const { pagina, rol } = document.body.dataset;
  const yo = api.auth.usuarioActual();
  const zona = document.body.dataset.zona === "cliente" && yo?.role === "admin" ? "panel" : document.body.dataset.zona;
  const main = document.querySelector("main");
  main.id = "contenido";

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

  if (zona === "publica" || (zona === "panel" && yo && main.dataset.bloqueada)) {
    main.insertAdjacentHTML("beforebegin", cabeceraPublica(zona === "publica" ? pagina : null, yo));
    main.insertAdjacentHTML("afterend", piePagina(zona === "publica"));
  } else if (zona === "cliente" && yo) {
    main.insertAdjacentHTML("beforebegin", cabeceraPublica(null, yo));
    const capa = envolver(main, "panel-layout", menuCliente(pagina, yo));
    main.classList.add("contenido-panel");
    capa.insertAdjacentHTML("afterend", piePagina());
  } else if (zona === "panel" && yo) {
    envolver(main, "panel-admin", menuLateral(pagina, yo));
    main.classList.add("contenido-admin");
    main.insertAdjacentHTML("afterbegin", barraPanel(yo));
    const reloj = document.getElementById("reloj-panel");
    const pintarHora = () => { reloj.textContent = horaMadrid(); };
    pintarHora();
    setInterval(pintarHora, 15000);
    montarMenuPanel();
    contadoresMenu(yo);
  }

  montarMenuMovil();
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

  pintarIconos();
  return main.dataset.bloqueada ? null : (yo || "invitado");
}

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

document.addEventListener("click", e => {
  const fila = e.target.closest("tr.clicable");
  if (fila && !e.target.closest("a, button, select, input")) location.href = fila.dataset.href;

  const verClave = e.target.closest(".ver-clave");
  if (verClave) {
    const campo = verClave.parentElement.querySelector("input");
    const ver = campo.type === "password";
    campo.type = ver ? "text" : "password";
    verClave.setAttribute("aria-pressed", ver);
    verClave.setAttribute("aria-label", ver ? "Ocultar la contraseña" : "Mostrar la contraseña");
  }
});
