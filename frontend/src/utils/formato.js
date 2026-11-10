// Textos y formatos que usan varias páginas

export const ESTADOS = {
  abierto: "Abierto",
  en_curso: "En curso",
  pendiente_cliente: "Pendiente del cliente",
  resuelto: "Resuelto",
  cerrado: "Cerrado"
};
export const PRIORIDADES = { baja: "Baja", media: "Media", alta: "Alta" };
export const ROLES = { cliente: "Cliente", agente: "Agente", admin: "Administrador" };
export const TEMATICAS = ["Humor", "Terror", "Espionaje", "Aventura", "Misterio", "Ciencia ficción"];
export const NIVELES = ["", "Iniciación", "Fácil", "Media", "Difícil", "Experto"];
export const INICIO_POR_ROL = { cliente: "/mis-tickets", agente: "/soporte", admin: "/admin" };
export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ruta de un archivo de public/ (en GitHub Pages la web cuelga de /noexitrooms/)
export const img = ruta => import.meta.env.BASE_URL + "img/" + ruta;

export const codigoTicket = id => "NXR-" + String(id).padStart(4, "0");
export const iniciales = nombre => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
export const precio = n => Number(n).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
export const claseFondo = tematica => "fondo-" + tematica.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
export const fecha = iso => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
export const fechaHora = iso => new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
// Fecha local en formato AAAA-MM-DD
export const diaIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Fotos de sala: la principal viene de rooms.image_url; la galería sale del slug
export function fotoSala(s) {
  if (!s.image_url) return img(`salas/${encodeURIComponent(s.slug)}/principal.webp`);
  return /^https?:/.test(s.image_url) ? s.image_url : import.meta.env.BASE_URL + s.image_url.replace(/^\//, "");
}
export const fotosGaleria = s => [1, 2, 3].map(n => img(`salas/${encodeURIComponent(s.slug)}/galeria-${n}.webp`));
