/* =====================================================================
   Capa de acceso a datos (API).
   Todos los componentes piden y guardan datos SOLO a través de `api`, que hace
   fetch() a la API REST del backend. El frontend nunca decide si algo está
   permitido: la sesión, el rol y la propiedad de cada recurso los comprueba
   siempre el backend, y aquí solo se enseña su respuesta.
   ===================================================================== */

// URL pública de la API desplegada en Render
const API_URL_PUBLICA = "https://noexitrooms-api.onrender.com/api";
// Con la web en tu ordenador (npm run dev) se usa el backend local
const API_URL_LOCAL = "http://localhost:3000/api";
const enLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
// Variable de entorno de Vite (archivo .env); si no está, se elige según dónde se abra la web
export const API_URL = import.meta.env.VITE_API_URL || (enLocal ? API_URL_LOCAL : API_URL_PUBLICA);

const CLAVE_SESION = "nxr-sesion";

/* ---------- Errores con código HTTP ---------- */
// `campos` trae el error de cada campo cuando el backend responde 400 (por ejemplo { email: "Escribe un email válido." })
export class ErrorApi extends Error {
  constructor(status, mensaje, campos = null) {
    super(mensaje);
    this.status = status;
    this.campos = campos;
  }
}

/* ---------- Sesión (token JWT y datos del usuario) ---------- */
function leerSesion() {
  try { return JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch { return null; }
}
let sesion = leerSesion();
// AuthContext se apunta aquí para enterarse cuando la sesión cambia (login, logout o token caducado)
let avisarCambio = () => {};
export function alCambiarSesion(funcion) { avisarCambio = funcion; }

export function usuarioGuardado() {
  return sesion ? sesion.usuario : null;
}

function guardarSesion(nueva) {
  sesion = nueva;
  try {
    if (nueva) localStorage.setItem(CLAVE_SESION, JSON.stringify(nueva));
    else localStorage.removeItem(CLAVE_SESION);
  } catch { /* sin almacenamiento: la sesión dura hasta recargar */ }
  avisarCambio(nueva ? nueva.usuario : null);
}

// Hace la petición, añade el token si hay sesión y convierte los errores del backend en ErrorApi
async function pedir(ruta, { metodo = "GET", cuerpo, consulta } = {}) {
  const url = new URL(API_URL + ruta);
  for (const [clave, valor] of Object.entries(consulta || {})) {
    if (valor !== undefined && valor !== null && valor !== "") url.searchParams.set(clave, valor);
  }
  const cabeceras = { Accept: "application/json" };
  if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  if (sesion?.token) cabeceras.Authorization = `Bearer ${sesion.token}`;

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

  // Token caducado o cuenta desactivada: se cierra la sesión y la ruta protegida manda al login
  if (res.status === 401 && sesion) guardarSesion(null);
  const error = datos?.error || {};
  const campos = error.campos || null;
  // Si el backend dice qué campo falla, ese es el mensaje más útil para enseñar
  const mensaje = (campos && Object.values(campos)[0]) || error.mensaje ||
    (res.status === 429 ? "Demasiados intentos. Espera unos minutos." : "Algo ha fallado en el servidor. Inténtalo de nuevo.");
  throw new ErrorApi(res.status, mensaje, campos);
}

export const api = {
  auth: {
    async login(email, password) {
      const nueva = await pedir("/auth/login", { metodo: "POST", cuerpo: { email, password } });
      guardarSesion(nueva);
      return nueva.usuario;
    },
    async registro({ name, email, password }) {
      const nueva = await pedir("/auth/register", { metodo: "POST", cuerpo: { name, email, password } });
      guardarSesion(nueva);
      return nueva.usuario;
    },
    cerrarSesion() { guardarSesion(null); }
  },

  perfil: {
    async actualizar({ name, email }) {
      const usuario = await pedir("/users/me", { metodo: "PUT", cuerpo: { name, email } });
      guardarSesion({ ...sesion, usuario });
      return usuario;
    },
    cambiarPassword: (actual, nueva) => pedir("/users/me/password", { metodo: "PUT", cuerpo: { actual, nueva } })
  },

  salas: {
    listar: ({ todas = false } = {}) => pedir("/rooms", { consulta: { all: todas ? 1 : undefined } }),
    obtener: slug => pedir(`/rooms/${encodeURIComponent(slug)}`),
    crear: datos => pedir("/rooms", { metodo: "POST", cuerpo: datos }),
    actualizar: (id, datos) => pedir(`/rooms/${id}`, { metodo: "PUT", cuerpo: datos }),
    borrar: id => pedir(`/rooms/${id}`, { metodo: "DELETE" })
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
    responder: (id, body, interno = false) => pedir(`/tickets/${id}/messages`, { metodo: "POST", cuerpo: { body, is_internal: interno } }),
    cambiarEstado: (id, status) => pedir(`/tickets/${id}/status`, { metodo: "PATCH", cuerpo: { status } }),
    cambiarPrioridad: (id, priority) => pedir(`/tickets/${id}`, { metodo: "PATCH", cuerpo: { priority } }),
    asignar: (id, agentId) => pedir(`/tickets/${id}/assign`, { metodo: "PATCH", cuerpo: { agent_id: agentId || null } })
  },

  estadisticas: () => pedir("/stats")
};
