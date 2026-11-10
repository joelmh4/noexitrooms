/* =====================================================================
   Capa de acceso a datos (API).
   Todas las páginas piden y guardan datos SOLO a través de `api`, que hace
   fetch() a la API REST del backend. El frontend nunca decide si algo está
   permitido: la sesión, el rol y la propiedad de cada recurso los comprueba
   siempre el backend, y aquí solo se enseña su respuesta.
   ===================================================================== */

// URL pública de la API desplegada en Render
const API_URL_PUBLICA = "https://noexitrooms-api.onrender.com/api";
// Si la web se abre en tu ordenador (localhost o con doble clic), usa el backend local
const API_URL_LOCAL = "http://localhost:3000/api";
const CLAVE_API = "nxr-api";
const CLAVE_SESION = "nxr-sesion";

// Para probar contra otra API, abre cualquier página con ?api=<url> y se recordará en este navegador.
// Con ?api=publica se vuelve a la URL normal.
const API_URL = (() => {
  const enLocal = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
  const porDefecto = enLocal ? API_URL_LOCAL : API_URL_PUBLICA;
  try {
    const pedida = new URLSearchParams(location.search).get("api");
    if (pedida === "publica") localStorage.removeItem(CLAVE_API);
    else if (pedida) localStorage.setItem(CLAVE_API, pedida.replace(/\/$/, ""));
    return localStorage.getItem(CLAVE_API) || porDefecto;
  } catch { return porDefecto; }
})();

/* ---------- Errores con código HTTP ---------- */
// `campos` trae el error de cada campo cuando el backend responde 400 (por ejemplo { email: "Escribe un email válido." })
class ErrorApi extends Error {
  constructor(status, mensaje, campos = null) {
    super(mensaje);
    this.status = status;
    this.campos = campos;
  }
}

/* ---------- Sesión (token JWT y datos del usuario) ---------- */
function leerAlmacen(clave) {
  try { return JSON.parse(localStorage.getItem(clave)); } catch { return null; }
}
let sesionGuardada = leerAlmacen(CLAVE_SESION);

function usuarioActual() {
  return sesionGuardada ? sesionGuardada.usuario : null;
}

function guardarSesion(sesion) {
  sesionGuardada = sesion;
  try {
    if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE_SESION);
  } catch { /* sin almacenamiento: la sesión dura hasta recargar */ }
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

const api = {
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
};
