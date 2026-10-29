// Categorías de los tickets (Reservas, Bonos, Objetos perdidos…). Solo el admin las crea o edita.
// No se borran: se desactivan, así los tickets antiguos siguen teniendo su categoría.
import { consultar, ejecutar } from "../db/conexion";
import { ErrorApi } from "../middleware/errores";
import type { Categoria } from "../models/tipos";

const normalizar = (c: Categoria): Categoria => ({ ...c, is_active: Boolean(c.is_active) });

export async function listar(todas: boolean): Promise<Categoria[]> {
  const donde = todas ? "" : "WHERE is_active = TRUE";
  return (await consultar<Categoria>(`SELECT id, name, is_active FROM ticket_categories ${donde} ORDER BY name`)).map(normalizar);
}

export async function buscarPorId(id: number): Promise<Categoria | null> {
  const [c] = await consultar<Categoria>("SELECT id, name, is_active FROM ticket_categories WHERE id = ?", [id]);
  return c ? normalizar(c) : null;
}

async function nombreOcupado(name: string, excepto = 0): Promise<boolean> {
  // La comparación de MySQL con utf8mb4_unicode_ci ya ignora mayúsculas y tildes
  const filas = await consultar<{ id: number }>("SELECT id FROM ticket_categories WHERE name = ? AND id <> ?", [name, excepto]);
  return filas.length > 0;
}

export async function crear(name: string): Promise<Categoria> {
  if (await nombreOcupado(name)) throw ErrorApi.conflicto("Esa categoría ya existe.");
  const r = await ejecutar("INSERT INTO ticket_categories (name) VALUES (?)", [name]);
  return (await buscarPorId(r.insertId))!;
}

export async function actualizar(id: number, cambios: { name?: string; is_active?: boolean }): Promise<Categoria> {
  if (!(await buscarPorId(id))) throw ErrorApi.noEncontrado("Esa categoría no existe.");
  if (cambios.name !== undefined && (await nombreOcupado(cambios.name, id))) throw ErrorApi.conflicto("Esa categoría ya existe.");
  const sets: string[] = [];
  const valores: (string | boolean)[] = [];
  if (cambios.name !== undefined) { sets.push("name = ?"); valores.push(cambios.name); }
  if (cambios.is_active !== undefined) { sets.push("is_active = ?"); valores.push(cambios.is_active); }
  await ejecutar(`UPDATE ticket_categories SET ${sets.join(", ")} WHERE id = ?`, [...valores, id]);
  return (await buscarPorId(id))!;
}
