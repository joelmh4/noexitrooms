/* =====================================================================
   Capa de acceso a datos (API).
   Todas las páginas piden y guardan datos SOLO a través de `api`.
   Hay dos versiones con las mismas funciones:
   - apiReal: hace fetch() a la API REST del backend (el proyecto de verdad).
   - apiDemo: lee y escribe los datos de ejemplo en el navegador
     (localStorage), para enseñar la web sin servidor. En el modo demo los
     permisos se imitan aquí, pero en el proyecto real los comprueba
     SIEMPRE el backend.
   ===================================================================== */

// URL de la API desplegada (nunca localhost). Mientras sea la de ejemplo, la web funciona en modo demo.
const API_URL_PUBLICA = "https://api.noexitrooms.example/api";
const CLAVE_API = "nxr-api";
const CLAVE_DEMO = "nxr-demo";
const CLAVE_SESION = "nxr-sesion";

// Para probar contra otra API (por ejemplo, el backend en tu ordenador), abre cualquier página con
// ?api=http://localhost:3000/api y se recordará en este navegador. Con ?api=publica se vuelve a la normal
// y con ?api=demo se fuerzan los datos de ejemplo.
const API_URL = (() => {
  try {
    const pedida = new URLSearchParams(location.search).get("api");
    if (pedida === "publica") localStorage.removeItem(CLAVE_API);
    else if (pedida) localStorage.setItem(CLAVE_API, pedida.replace(/\/$/, ""));
    return localStorage.getItem(CLAVE_API) || API_URL_PUBLICA;
  } catch { return API_URL_PUBLICA; }
})();
const MODO_DEMO = API_URL === "demo" || API_URL.includes(".example");

/* ---------- Errores con código HTTP ---------- */
// `campos` trae el error de cada campo cuando el backend responde 400 (por ejemplo { email: "Escribe un email válido." })
class ErrorApi extends Error {
  constructor(status, mensaje, campos = null) {
    super(mensaje);
    this.status = status;
    this.campos = campos;
  }
}

/* ---------- Almacenamiento del modo demo ---------- */
function leerAlmacen(clave) {
  try { return JSON.parse(localStorage.getItem(clave)); } catch { return null; }
}
function guardarAlmacen(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento: solo se pierde al recargar */ }
}

let bd = leerAlmacen(CLAVE_DEMO) || structuredClone(DATOS_DEMO);
if (!bd.reservas) bd.reservas = structuredClone(DATOS_DEMO.reservas);   // datos guardados antes de añadir las reservas
if ((bd.version || 1) < 2) {                                            // el Camarote pasó a estar activo (29-10-2026)
  const camarote = bd.salas?.find(s => s.slug === "el-camarote-del-capitan-eduardo-el-panzas");
  if (camarote) camarote.is_active = true;
  bd.version = 2;
}
function guardarBd() { guardarAlmacen(CLAVE_DEMO, bd); }
function reiniciarDemo() {
  bd = structuredClone(DATOS_DEMO);
  guardarBd();
}

// Simula el tiempo de respuesta de un servidor
function respuesta(datos) {
  return new Promise(resolver => setTimeout(() => resolver(structuredClone(datos)), 120));
}
function ahora() { return new Date().toISOString().slice(0, 19); }
function siguienteId(lista) { return lista.reduce((max, el) => Math.max(max, el.id), 0) + 1; }

/* ---------- Horario de las sesiones ----------
   Lo decide el backend: aquí solo lo imita el modo demo.
   San Tomás dura 150 minutos y tiene menos pases. */
const HORARIO = {
  normal: ["10:00", "12:00", "16:00", "18:00", "20:00", "22:00"],
  largo: ["10:00", "16:00", "19:30"]
};
const ESTADOS_RESERVA = { pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada" };
function diaIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Fecha y hora local "AAAA-MM-DDTHH:MM" (las sesiones van en hora de Madrid)
function minutoLocal(d = new Date()) {
  return `${diaIso(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ---------- Sesión ---------- */
let sesionGuardada = leerAlmacen(CLAVE_SESION);

function usuarioActual() {
  return sesionGuardada ? sesionGuardada.usuario : null;
}
function exigirSesion() {
  const yo = usuarioActual();
  if (!yo) throw new ErrorApi(401, "Tienes que iniciar sesión.");
  return yo;
}
function exigirRol(...roles) {
  const yo = exigirSesion();
  if (!roles.includes(yo.role)) throw new ErrorApi(403, "No tienes permiso para hacer esto.");
  return yo;
}
function sinPassword(u) {
  const { password, ...resto } = u;
  return resto;
}
function slugDe(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const apiDemo = {
  /* ---------------- Autenticación ---------------- */
  auth: {
    // POST /auth/login → { token, usuario }
    async login(email, password) {
      const u = bd.usuarios.find(x => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u || u.password !== password) throw new ErrorApi(401, "El email o la contraseña no son correctos.");
      if (!u.is_active) throw new ErrorApi(403, "Esta cuenta está desactivada. Escríbenos desde Contacto.");
      sesionGuardada = { token: "demo-" + u.id, usuario: sinPassword(u) };
      guardarAlmacen(CLAVE_SESION, sesionGuardada);
      return respuesta(sesionGuardada.usuario);
    },
    // POST /auth/register → siempre crea un cliente
    async registro({ name, email, password }) {
      if (bd.usuarios.some(x => x.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new ErrorApi(409, "Ya existe una cuenta con ese email.");
      }
      const nuevo = { id: siguienteId(bd.usuarios), name: name.trim(), email: email.trim(), password, role: "cliente", is_active: true, created_at: ahora() };
      bd.usuarios.push(nuevo);
      guardarBd();
      return apiDemo.auth.login(email, password);
    },
    cerrarSesion() {
      sesionGuardada = null;
      try { localStorage.removeItem(CLAVE_SESION); } catch { /* nada */ }
    },
    usuarioActual
  },

  /* ---------------- Perfil ---------------- */
  perfil: {
    // PUT /users/me
    async actualizar({ name, email }) {
      const yo = exigirSesion();
      if (bd.usuarios.some(x => x.id !== yo.id && x.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new ErrorApi(409, "Ese email ya lo usa otra cuenta.");
      }
      const u = bd.usuarios.find(x => x.id === yo.id);
      u.name = name.trim();
      u.email = email.trim();
      guardarBd();
      sesionGuardada.usuario = sinPassword(u);
      guardarAlmacen(CLAVE_SESION, sesionGuardada);
      return respuesta(sesionGuardada.usuario);
    },
    // PUT /users/me/password
    async cambiarPassword(actual, nueva) {
      const yo = exigirSesion();
      const u = bd.usuarios.find(x => x.id === yo.id);
      if (u.password !== actual) throw new ErrorApi(400, "La contraseña actual no es correcta.");
      u.password = nueva;
      guardarBd();
      return respuesta(true);
    }
  },

  /* ---------------- Salas ---------------- */
  salas: {
    // GET /rooms (público: solo activas) · GET /rooms?all=1 (admin)
    async listar({ todas = false } = {}) {
      if (todas) exigirRol("admin");
      return respuesta(todas ? bd.salas : bd.salas.filter(s => s.is_active));
    },
    // GET /rooms/:slug
    async obtener(slug) {
      const s = bd.salas.find(x => x.slug === slug && x.is_active);
      if (!s) throw new ErrorApi(404, "Esa sala no existe.");
      return respuesta(s);
    },
    // POST /rooms (admin)
    async crear(datos) {
      exigirRol("admin");
      const slug = slugDe(datos.name);
      if (bd.salas.some(s => s.slug === slug)) throw new ErrorApi(409, "Ya hay una sala con ese nombre.");
      const sala = { ...datos, id: siguienteId(bd.salas), slug, pruebas: [] };
      bd.salas.push(sala);
      guardarBd();
      return respuesta(sala);
    },
    // PUT /rooms/:id (admin)
    async actualizar(id, datos) {
      exigirRol("admin");
      const sala = bd.salas.find(s => s.id === id);
      if (!sala) throw new ErrorApi(404, "Esa sala no existe.");
      const slug = slugDe(datos.name);
      if (bd.salas.some(s => s.id !== id && s.slug === slug)) throw new ErrorApi(409, "Ya hay una sala con ese nombre.");
      Object.assign(sala, datos, { slug });
      guardarBd();
      return respuesta(sala);
    },
    // DELETE /rooms/:id (admin)
    async borrar(id) {
      exigirRol("admin");
      if (bd.tickets.some(t => t.room_id === id)) {
        throw new ErrorApi(409, "La sala tiene tickets asociados. Desactívala en lugar de borrarla.");
      }
      bd.salas = bd.salas.filter(s => s.id !== id);
      guardarBd();
      return respuesta(true);
    }
  },

  /* ---------------- Reservas (bookings) ---------------- */
  reservas: {
    // GET /rooms/:id/slots?from=AAAA-MM-DD&days=7 (público)
    // → [{ fecha, horas: [{ hora, starts_at, estado: "libre" | "ocupada" | "tuya" | "pasada" }] }]
    // No dice quién ha reservado: solo si el hueco está libre.
    async huecos(salaId, desde, dias = 7) {
      const sala = bd.salas.find(s => s.id === salaId && s.is_active);
      if (!sala) throw new ErrorApi(404, "Esa sala no existe.");
      const yo = usuarioActual();
      const horas = sala.duration_min > 120 ? HORARIO.largo : HORARIO.normal;
      const ahoraMismo = minutoLocal();
      const inicio = new Date(desde + "T00:00:00");
      const resultado = [];
      for (let i = 0; i < dias; i++) {
        const d = new Date(inicio);
        d.setDate(d.getDate() + i);
        const fecha = diaIso(d);
        resultado.push({
          fecha,
          horas: horas.map(hora => {
            const starts_at = `${fecha}T${hora}:00`;
            const r = bd.reservas.find(x => x.room_id === salaId && x.starts_at === starts_at && x.status !== "cancelada");
            const estado = starts_at.slice(0, 16) <= ahoraMismo ? "pasada" : !r ? "libre" : yo && r.customer_id === yo.id ? "tuya" : "ocupada";
            return { hora, starts_at, estado };
          })
        });
      }
      return respuesta(resultado);
    },
    // POST /bookings (cliente) → la reserva queda pendiente hasta que la confirme el equipo
    async crear({ room_id, starts_at, players }) {
      const yo = exigirRol("cliente");
      const sala = bd.salas.find(s => s.id === room_id && s.is_active);
      if (!sala) throw new ErrorApi(404, "Esa sala no existe.");
      if (starts_at.slice(0, 16) <= minutoLocal()) throw new ErrorApi(400, "Esa hora ya ha pasado.");
      if (players < sala.min_players || players > sala.max_players) {
        throw new ErrorApi(400, `En esta sala jugáis de ${sala.min_players} a ${sala.max_players} personas.`);
      }
      // En MySQL lo asegura la restricción UNIQUE (room_id, starts_at)
      if (bd.reservas.some(r => r.room_id === room_id && r.starts_at === starts_at && r.status !== "cancelada")) {
        throw new ErrorApi(409, "Alguien acaba de reservar esa hora. Elige otra.");
      }
      const reserva = { id: siguienteId(bd.reservas), customer_id: yo.id, room_id, starts_at, players, status: "pendiente", created_at: ahora() };
      bd.reservas.push(reserva);
      guardarBd();
      return respuesta(reserva);
    },
    // GET /bookings/me (cliente)
    async mias() {
      const yo = exigirRol("cliente");
      return respuesta(bd.reservas
        .filter(r => r.customer_id === yo.id)
        .map(r => ({ ...r, sala: bd.salas.find(s => s.id === r.room_id) }))
        .sort((a, b) => b.starts_at.localeCompare(a.starts_at)));
    }
  },

  /* ---------------- Categorías ---------------- */
  categorias: {
    // GET /categories (solo activas) · GET /categories?all=1 (admin)
    async listar({ todas = false } = {}) {
      if (todas) exigirRol("admin");
      return respuesta(todas ? bd.categorias : bd.categorias.filter(c => c.is_active));
    },
    // POST /categories (admin)
    async crear(name) {
      exigirRol("admin");
      if (bd.categorias.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) throw new ErrorApi(409, "Esa categoría ya existe.");
      const cat = { id: siguienteId(bd.categorias), name: name.trim(), is_active: true };
      bd.categorias.push(cat);
      guardarBd();
      return respuesta(cat);
    },
    // PUT /categories/:id (admin)
    async actualizar(id, cambios) {
      exigirRol("admin");
      const cat = bd.categorias.find(c => c.id === id);
      if (!cat) throw new ErrorApi(404, "Esa categoría no existe.");
      if (cambios.name && bd.categorias.some(c => c.id !== id && c.name.toLowerCase() === cambios.name.trim().toLowerCase())) {
        throw new ErrorApi(409, "Esa categoría ya existe.");
      }
      Object.assign(cat, cambios);
      guardarBd();
      return respuesta(cat);
    }
  },

  /* ---------------- Usuarios (admin) ---------------- */
  usuarios: {
    // GET /users
    async listar() {
      exigirRol("admin");
      return respuesta(bd.usuarios.map(sinPassword));
    },
    // GET /users?role=agente (para asignar tickets)
    async agentes() {
      exigirRol("admin", "agente");
      return respuesta(bd.usuarios.filter(u => u.role === "agente" && u.is_active).map(sinPassword));
    },
    // PATCH /users/:id
    async actualizar(id, cambios) {
      const yo = exigirRol("admin");
      if (id === yo.id) throw new ErrorApi(400, "No puedes cambiar tu propio rol ni desactivar tu cuenta.");
      const u = bd.usuarios.find(x => x.id === id);
      if (!u) throw new ErrorApi(404, "Ese usuario no existe.");
      Object.assign(u, cambios);
      guardarBd();
      return respuesta(sinPassword(u));
    }
  },

  /* ---------------- Tickets ---------------- */
  tickets: {
    // GET /tickets → el backend devuelve solo lo que el rol puede ver
    async listar() {
      const yo = exigirSesion();
      let lista = bd.tickets;
      if (yo.role === "cliente") lista = lista.filter(t => t.customer_id === yo.id);
      if (yo.role === "agente") lista = lista.filter(t => t.agent_id === yo.id || t.agent_id === null);
      return respuesta(lista.map(completarTicket).sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
    },
    // GET /tickets/:id → mensajes e historial incluidos
    async obtener(id) {
      const yo = exigirSesion();
      const t = bd.tickets.find(x => x.id === id);
      if (!t || (yo.role === "cliente" && t.customer_id !== yo.id)) {
        // 404 también si no es suyo: así no se sabe si el ticket existe
        throw new ErrorApi(404, "No tienes acceso a este ticket o no existe.");
      }
      const ticket = completarTicket(t);
      ticket.mensajes = bd.mensajes
        .filter(m => m.ticket_id === id && (yo.role !== "cliente" || !m.is_internal))
        .map(m => ({ ...m, autor: autorDe(m.author_id) }));
      ticket.historial = bd.historial
        .filter(h => h.ticket_id === id)
        .map(h => ({ ...h, autor: autorDe(h.changed_by_id) }));
      return respuesta(ticket);
    },
    // POST /tickets (cliente)
    async crear({ subject, category_id, room_id, priority, description }) {
      const yo = exigirRol("cliente");
      const fecha = ahora();
      const t = {
        id: siguienteId(bd.tickets), customer_id: yo.id, agent_id: null, category_id, room_id: room_id || null,
        subject: subject.trim(), description: description.trim(), priority, status: "abierto",
        created_at: fecha, updated_at: fecha, closed_at: null
      };
      bd.tickets.push(t);
      bd.mensajes.push({ id: siguienteId(bd.mensajes), ticket_id: t.id, author_id: yo.id, body: t.description, is_internal: false, created_at: fecha });
      bd.historial.push({ id: siguienteId(bd.historial), ticket_id: t.id, changed_by_id: yo.id, old_status: null, new_status: "abierto", changed_at: fecha });
      guardarBd();
      return respuesta(completarTicket(t));
    },
    // POST /tickets/:id/messages
    async responder(id, body, interno = false) {
      const yo = exigirSesion();
      const t = ticketPermitido(id, yo);
      if (t.status === "cerrado") throw new ErrorApi(409, "El ticket está cerrado. Pide reabrirlo para seguir escribiendo.");
      if (interno && yo.role === "cliente") throw new ErrorApi(403, "Los clientes no pueden escribir notas internas.");
      const fecha = ahora();
      bd.mensajes.push({ id: siguienteId(bd.mensajes), ticket_id: id, author_id: yo.id, body: body.trim(), is_internal: interno, created_at: fecha });
      // Si el cliente contesta a una petición del equipo, el ticket vuelve a "En curso"
      if (yo.role === "cliente" && t.status === "pendiente_cliente") cambiarEstadoInterno(t, "en_curso", yo.id, fecha);
      t.updated_at = fecha;
      guardarBd();
      return respuesta(true);
    },
    // PATCH /tickets/:id/status
    async cambiarEstado(id, nuevo) {
      const yo = exigirSesion();
      const t = ticketPermitido(id, yo);
      if (yo.role === "cliente") {
        // El cliente solo puede confirmar el cierre de un ticket resuelto o pedir reabrirlo
        const permitido = (t.status === "resuelto" && nuevo === "cerrado") ||
                          (["resuelto", "cerrado"].includes(t.status) && nuevo === "abierto");
        if (!permitido) throw new ErrorApi(403, "No puedes cambiar el estado de esta forma.");
      }
      if (yo.role === "agente" && nuevo === "cerrado") throw new ErrorApi(403, "Solo el cliente o un administrador pueden cerrar el ticket.");
      if (t.status === nuevo) return respuesta(true);
      cambiarEstadoInterno(t, nuevo, yo.id, ahora());
      guardarBd();
      return respuesta(true);
    },
    // PATCH /tickets/:id (agente o admin)
    async cambiarPrioridad(id, priority) {
      const yo = exigirRol("agente", "admin");
      const t = ticketPermitido(id, yo);
      t.priority = priority;
      t.updated_at = ahora();
      guardarBd();
      return respuesta(true);
    },
    // PATCH /tickets/:id/assign (admin) · el agente puede asignarse uno libre
    async asignar(id, agentId) {
      const yo = exigirRol("agente", "admin");
      const t = ticketPermitido(id, yo);
      if (yo.role === "agente" && (agentId !== yo.id || t.agent_id !== null)) {
        throw new ErrorApi(403, "Solo puedes quedarte tickets sin asignar.");
      }
      t.agent_id = agentId || null;
      t.updated_at = ahora();
      guardarBd();
      return respuesta(true);
    }
  },

  // GET /stats (agente o admin): las mismas cuentas que hace el backend con SQL
  async estadisticas() {
    const yo = exigirRol("agente", "admin");
    const mios = yo.role === "agente" ? bd.tickets.filter(t => t.agent_id === yo.id) : bd.tickets;
    const activo = t => !["resuelto", "cerrado"].includes(t.status);
    const contar = (claves, lista, campo) => Object.fromEntries(claves.map(k => [k, lista.filter(t => t[campo] === k).length]));
    const libres = bd.tickets.filter(t => t.agent_id === null && t.status !== "cerrado");
    // Horas desde que se abre hasta que se marca resuelto por primera vez
    const horas = mios.map(t => {
      const resuelto = bd.historial.filter(h => h.ticket_id === t.id && h.new_status === "resuelto").map(h => h.changed_at).sort()[0];
      return resuelto ? (new Date(resuelto) - new Date(t.created_at)) / 36e5 : null;
    }).filter(h => h !== null);
    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 6);
    const desde = diaIso(hace7);
    const dias = {};
    mios.filter(t => t.created_at.slice(0, 10) >= desde).forEach(t => { dias[t.created_at.slice(0, 10)] = (dias[t.created_at.slice(0, 10)] || 0) + 1; });
    const porEstado = contar(Object.keys(ESTADOS), mios, "status");
    const base = {
      tickets: {
        total: mios.length,
        activos: mios.filter(activo).length,
        por_estado: porEstado,
        activos_por_prioridad: contar(Object.keys(PRIORIDADES), mios.filter(activo), "priority"),
        por_categoria: bd.categorias.map(c => ({ id: c.id, name: c.name, n: mios.filter(t => t.category_id === c.id).length }))
          .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)),
        sin_asignar: { total: libres.length, alta: libres.filter(t => t.priority === "alta").length },
        horas_medias_hasta_resolver: horas.length ? Math.round(horas.reduce((a, b) => a + b, 0) / horas.length * 10) / 10 : null,
        creados_ultimos_7_dias: Object.keys(dias).sort().map(dia => ({ dia, n: dias[dia] }))
      }
    };
    if (yo.role === "agente") return respuesta(base);
    const ahoraMismo = minutoLocal();
    const en7 = new Date();
    en7.setDate(en7.getDate() + 7);
    return respuesta({
      ...base,
      agentes: bd.usuarios.filter(u => u.role === "agente" && u.is_active).map(u => {
        const suyos = bd.tickets.filter(t => t.agent_id === u.id);
        return {
          id: u.id, name: u.name,
          activos: suyos.filter(activo).length,
          pendientes_cliente: suyos.filter(t => t.status === "pendiente_cliente").length,
          resueltos: suyos.filter(t => !activo(t)).length
        };
      }).sort((a, b) => b.activos - a.activos || a.name.localeCompare(b.name)),
      reservas: {
        pendientes_de_confirmar: bd.reservas.filter(r => r.status === "pendiente").length,
        proximos_7_dias: bd.reservas.filter(r => r.status !== "cancelada" && r.starts_at.slice(0, 16) >= ahoraMismo && r.starts_at.slice(0, 10) < diaIso(en7)).length
      }
    });
  },

  reiniciarDemo,
  modoDemo: true
};

/* ---------- Ayudantes internos ---------- */
function autorDe(id) {
  const u = bd.usuarios.find(x => x.id === id);
  return u ? { id: u.id, name: u.name, role: u.role } : { id, name: "Usuario borrado", role: "cliente" };
}
function completarTicket(t) {
  const cat = bd.categorias.find(c => c.id === t.category_id);
  const sala = bd.salas.find(s => s.id === t.room_id);
  return {
    ...t,
    cliente: autorDe(t.customer_id),
    agente: t.agent_id ? autorDe(t.agent_id) : null,
    categoria: cat ? cat.name : "Sin categoría",
    sala: sala ? { name: sala.name, slug: sala.slug } : null
  };
}
function ticketPermitido(id, yo) {
  const t = bd.tickets.find(x => x.id === id);
  if (!t) throw new ErrorApi(404, "Ese ticket no existe.");
  if (yo.role === "cliente" && t.customer_id !== yo.id) throw new ErrorApi(404, "No tienes acceso a este ticket o no existe.");
  if (yo.role === "agente" && t.agent_id !== yo.id && t.agent_id !== null) throw new ErrorApi(403, "Este ticket lo lleva otro agente.");
  return t;
}
function cambiarEstadoInterno(t, nuevo, quien, fecha) {
  bd.historial.push({ id: siguienteId(bd.historial), ticket_id: t.id, changed_by_id: quien, old_status: t.status, new_status: nuevo, changed_at: fecha });
  t.status = nuevo;
  t.updated_at = fecha;
  t.closed_at = nuevo === "cerrado" ? fecha : null;
}

/* =====================================================================
   API real: las mismas funciones, pero contra el backend.
   ===================================================================== */
function guardarSesion(sesion) {
  sesionGuardada = sesion;
  if (sesion) guardarAlmacen(CLAVE_SESION, sesion);
  else try { localStorage.removeItem(CLAVE_SESION); } catch { /* nada */ }
}

// Hace la petición, añade el token si hay sesión y convierte los errores del backend en ErrorApi
async function pedir(ruta, { metodo = "GET", cuerpo, consulta } = {}) {
  const url = new URL(API_URL + ruta);
  for (const [clave, valor] of Object.entries(consulta || {})) {
    if (valor !== undefined && valor !== null && valor !== "") url.searchParams.set(clave, valor);
  }
  const cabeceras = { Accept: "application/json" };
  if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  if (sesionGuardada?.token) cabeceras.Authorization = `Bearer ${sesionGuardada.token}`;

  let res;
  try {
    res = await fetch(url, { method: metodo, headers: cabeceras, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  } catch {
    throw new ErrorApi(0, "No se puede conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
  }
  const texto = await res.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { /* respuesta que no es JSON */ }
  if (res.ok) return datos;

  // Token caducado o cuenta borrada: se cierra la sesión para que la página mande al login
  if (res.status === 401 && sesionGuardada) guardarSesion(null);
  const error = datos?.error || {};
  const campos = error.campos || null;
  // Si el backend dice qué campo falla, ese es el mensaje más útil para enseñar
  const mensaje = (campos && Object.values(campos)[0]) || error.mensaje ||
    (res.status === 429 ? "Demasiados intentos. Espera unos minutos." : "Algo ha fallado en el servidor. Inténtalo de nuevo.");
  throw new ErrorApi(res.status, mensaje, campos);
}

const apiReal = {
  auth: {
    async login(email, password) {
      const sesion = await pedir("/auth/login", { metodo: "POST", cuerpo: { email, password } });
      guardarSesion(sesion);
      return sesion.usuario;
    },
    async registro({ name, email, password }) {
      const sesion = await pedir("/auth/register", { metodo: "POST", cuerpo: { name, email, password } });
      guardarSesion(sesion);
      return sesion.usuario;
    },
    cerrarSesion() { guardarSesion(null); },
    usuarioActual
  },

  perfil: {
    async actualizar({ name, email }) {
      const usuario = await pedir("/users/me", { metodo: "PUT", cuerpo: { name, email } });
      guardarSesion({ ...sesionGuardada, usuario });
      return usuario;
    },
    async cambiarPassword(actual, nueva) {
      await pedir("/users/me/password", { metodo: "PUT", cuerpo: { actual, nueva } });
      return true;
    }
  },

  salas: {
    listar: ({ todas = false } = {}) => pedir("/rooms", { consulta: { all: todas ? 1 : undefined } }),
    obtener: slug => pedir(`/rooms/${encodeURIComponent(slug)}`),
    crear: datos => pedir("/rooms", { metodo: "POST", cuerpo: datos }),
    actualizar: (id, datos) => pedir(`/rooms/${id}`, { metodo: "PUT", cuerpo: datos }),
    async borrar(id) { await pedir(`/rooms/${id}`, { metodo: "DELETE" }); return true; }
  },

  reservas: {
    huecos: (salaId, desde, dias = 7) => pedir(`/rooms/${salaId}/slots`, { consulta: { from: desde, days: dias } }),
    crear: ({ room_id, starts_at, players }) => pedir("/bookings", { metodo: "POST", cuerpo: { room_id, starts_at, players } }),
    mias: () => pedir("/bookings/me")
  },

  categorias: {
    listar: ({ todas = false } = {}) => pedir("/categories", { consulta: { all: todas ? 1 : undefined } }),
    crear: name => pedir("/categories", { metodo: "POST", cuerpo: { name } }),
    actualizar: (id, cambios) => pedir(`/categories/${id}`, { metodo: "PUT", cuerpo: cambios })
  },

  usuarios: {
    listar: () => pedir("/users"),
    // Solo los activos: son a los que se puede asignar un ticket
    async agentes() { return (await pedir("/users", { consulta: { role: "agente" } })).filter(u => u.is_active); },
    actualizar: (id, cambios) => pedir(`/users/${id}`, { metodo: "PATCH", cuerpo: cambios })
  },

  tickets: {
    listar: (filtros = {}) => pedir("/tickets", { consulta: filtros }),
    obtener: id => pedir(`/tickets/${id}`),
    crear: ({ subject, category_id, room_id, priority, description }) =>
      pedir("/tickets", { metodo: "POST", cuerpo: { subject, category_id, room_id: room_id || null, priority, description } }),
    async responder(id, body, interno = false) {
      await pedir(`/tickets/${id}/messages`, { metodo: "POST", cuerpo: { body, is_internal: interno } });
      return true;
    },
    async cambiarEstado(id, status) {
      await pedir(`/tickets/${id}/status`, { metodo: "PATCH", cuerpo: { status } });
      return true;
    },
    async cambiarPrioridad(id, priority) {
      await pedir(`/tickets/${id}`, { metodo: "PATCH", cuerpo: { priority } });
      return true;
    },
    async asignar(id, agentId) {
      await pedir(`/tickets/${id}/assign`, { metodo: "PATCH", cuerpo: { agent_id: agentId || null } });
      return true;
    }
  },

  estadisticas: () => pedir("/stats"),

  // Con el backend no hay datos de demo que reiniciar
  reiniciarDemo() {},
  modoDemo: false
};

const api = MODO_DEMO ? apiDemo : apiReal;
