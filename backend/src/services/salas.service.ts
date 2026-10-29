// Salas: el CRUD del módulo temático. Leer es público (solo las activas); crear, editar y borrar, solo el admin.
import { consultar, ejecutar } from "../db/conexion";
import { ErrorApi } from "../middleware/errores";
import type { Sala } from "../models/tipos";

export type DatosSala = Pick<Sala,
  "name" | "theme" | "difficulty" | "duration_min" | "min_players" | "max_players" |
  "price_per_person" | "description" | "tagline" | "min_age" | "image_url" | "is_active">;

export interface FiltrosSalas {
  todas?: boolean;
  q?: string;
  theme?: string;
  difficulty?: number;
  players?: number;
  orden?: "nombre" | "dificultad" | "precio" | "duracion";
}

// MySQL devuelve DECIMAL como texto y BOOLEAN como 0/1
const normalizar = (s: Sala): Sala => ({ ...s, price_per_person: Number(s.price_per_person), is_active: Boolean(s.is_active) });

// "El manicomio de San Tomás" → "el-manicomio-de-san-tomas" (igual que slugDe del frontend)
export const slugDe = (texto: string) =>
  texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function listar(f: FiltrosSalas): Promise<Sala[]> {
  const condiciones: string[] = [];
  const valores: (string | number)[] = [];
  if (!f.todas) condiciones.push("is_active = TRUE");
  if (f.q) { condiciones.push("(name LIKE ? OR tagline LIKE ? OR description LIKE ?)"); valores.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`); }
  if (f.theme) { condiciones.push("theme = ?"); valores.push(f.theme); }
  if (f.difficulty) { condiciones.push("difficulty = ?"); valores.push(f.difficulty); }
  if (f.players) { condiciones.push("? BETWEEN min_players AND max_players"); valores.push(f.players); }
  const orden = { nombre: "name", dificultad: "difficulty, name", precio: "price_per_person, name", duracion: "duration_min, name" }[f.orden ?? "nombre"];
  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  return (await consultar<Sala>(`SELECT * FROM rooms ${donde} ORDER BY ${orden}`, valores)).map(normalizar);
}

// Por slug (la web pública) o por id (el panel)
export async function buscar(clave: string | number, { soloActivas = true } = {}): Promise<Sala> {
  const columna = typeof clave === "number" ? "id" : "slug";
  const activa = soloActivas ? "AND is_active = TRUE" : "";
  const [s] = await consultar<Sala>(`SELECT * FROM rooms WHERE ${columna} = ? ${activa}`, [clave]);
  if (!s) throw ErrorApi.noEncontrado("Esa sala no existe.");
  return normalizar(s);
}

async function nombreOcupado(slug: string, name: string, excepto = 0): Promise<boolean> {
  const filas = await consultar<{ id: number }>("SELECT id FROM rooms WHERE (slug = ? OR name = ?) AND id <> ?", [slug, name, excepto]);
  return filas.length > 0;
}

export async function crear(d: DatosSala): Promise<Sala> {
  const slug = slugDe(d.name);
  if (await nombreOcupado(slug, d.name)) throw ErrorApi.conflicto("Ya hay una sala con ese nombre.");
  const r = await ejecutar(
    `INSERT INTO rooms (name, slug, theme, difficulty, duration_min, min_players, max_players, price_per_person,
                        description, tagline, min_age, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.name, slug, d.theme, d.difficulty, d.duration_min, d.min_players, d.max_players, d.price_per_person,
      d.description, d.tagline, d.min_age, d.image_url ?? `img/salas/${slug}/principal.webp`, d.is_active]);
  return buscar(r.insertId, { soloActivas: false });
}

export async function actualizar(id: number, d: DatosSala): Promise<Sala> {
  const actual = await buscar(id, { soloActivas: false });
  const slug = slugDe(d.name);
  if (await nombreOcupado(slug, d.name, id)) throw ErrorApi.conflicto("Ya hay una sala con ese nombre.");
  await ejecutar(
    `UPDATE rooms SET name = ?, slug = ?, theme = ?, difficulty = ?, duration_min = ?, min_players = ?, max_players = ?,
                      price_per_person = ?, description = ?, tagline = ?, min_age = ?, image_url = ?, is_active = ?
      WHERE id = ?`,
    [d.name, slug, d.theme, d.difficulty, d.duration_min, d.min_players, d.max_players, d.price_per_person,
      d.description, d.tagline, d.min_age, d.image_url ?? actual.image_url, d.is_active, id]);
  return buscar(id, { soloActivas: false });
}

// Una sala con tickets o reservas no se borra: se desactiva (así no se pierde el historial)
export async function borrar(id: number): Promise<void> {
  await buscar(id, { soloActivas: false });
  const [uso] = await consultar<{ tickets: number; reservas: number }>(
    `SELECT (SELECT COUNT(*) FROM tickets WHERE room_id = ?) AS tickets,
            (SELECT COUNT(*) FROM bookings WHERE room_id = ?) AS reservas`, [id, id]);
  if (Number(uso.tickets) || Number(uso.reservas)) {
    throw ErrorApi.conflicto("La sala tiene tickets o reservas asociados. Desactívala en lugar de borrarla.");
  }
  await ejecutar("DELETE FROM rooms WHERE id = ?", [id]);
}
