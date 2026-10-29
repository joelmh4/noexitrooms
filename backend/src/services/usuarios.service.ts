// Acceso a la tabla users. Nada sale de aquí con el hash de la contraseña salvo buscarConHash (solo para el login).
import bcrypt from "bcryptjs";
import { consultar, ejecutar } from "../db/conexion";
import { ErrorApi } from "../middleware/errores";
import type { Rol, Usuario, UsuarioPublico } from "../models/tipos";

const COLUMNAS = "id, name, email, role, is_active, created_at";
export const COSTE_BCRYPT = 10;

// MySQL devuelve BOOLEAN como 0/1: lo pasamos a true/false
const normalizar = (u: UsuarioPublico): UsuarioPublico => ({ ...u, is_active: Boolean(u.is_active) });

export async function buscarPorId(id: number): Promise<UsuarioPublico | null> {
  const [u] = await consultar<UsuarioPublico>(`SELECT ${COLUMNAS} FROM users WHERE id = ?`, [id]);
  return u ? normalizar(u) : null;
}

export async function buscarConHash(email: string): Promise<Usuario | null> {
  const [u] = await consultar<Usuario>("SELECT * FROM users WHERE email = ?", [email]);
  return u ? { ...u, is_active: Boolean(u.is_active) } : null;
}

async function emailOcupado(email: string, excepto = 0): Promise<boolean> {
  const filas = await consultar<{ id: number }>("SELECT id FROM users WHERE email = ? AND id <> ?", [email, excepto]);
  return filas.length > 0;
}

// El registro público SIEMPRE crea un cliente: el rol no se lee de la petición
export async function crearCliente(datos: { name: string; email: string; password: string }): Promise<UsuarioPublico> {
  if (await emailOcupado(datos.email)) throw ErrorApi.conflicto("Ya existe una cuenta con ese email.");
  const hash = await bcrypt.hash(datos.password, COSTE_BCRYPT);
  const r = await ejecutar("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'cliente')", [datos.name, datos.email, hash]);
  return (await buscarPorId(r.insertId))!;
}

export async function actualizarPerfil(id: number, datos: { name: string; email: string }): Promise<UsuarioPublico> {
  if (await emailOcupado(datos.email, id)) throw ErrorApi.conflicto("Ese email ya lo usa otra cuenta.");
  await ejecutar("UPDATE users SET name = ?, email = ? WHERE id = ?", [datos.name, datos.email, id]);
  return (await buscarPorId(id))!;
}

export async function cambiarPassword(id: number, actual: string, nueva: string): Promise<void> {
  const [fila] = await consultar<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [id]);
  if (!fila || !(await bcrypt.compare(actual, fila.password_hash))) {
    throw ErrorApi.datosInvalidos({ actual: "La contraseña actual no es correcta." });
  }
  await ejecutar("UPDATE users SET password_hash = ? WHERE id = ?", [await bcrypt.hash(nueva, COSTE_BCRYPT), id]);
}

export async function listar(filtros: { role?: Rol; q?: string; soloActivos?: boolean }): Promise<UsuarioPublico[]> {
  const condiciones: string[] = [];
  const valores: (string | number)[] = [];
  if (filtros.role) { condiciones.push("role = ?"); valores.push(filtros.role); }
  if (filtros.q) { condiciones.push("(name LIKE ? OR email LIKE ?)"); valores.push(`%${filtros.q}%`, `%${filtros.q}%`); }
  if (filtros.soloActivos) condiciones.push("is_active = TRUE");
  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const filas = await consultar<UsuarioPublico>(`SELECT ${COLUMNAS} FROM users ${donde} ORDER BY role, name`, valores);
  return filas.map(normalizar);
}

export async function actualizarComoAdmin(id: number, cambios: { role?: Rol; is_active?: boolean }): Promise<UsuarioPublico> {
  const sets: string[] = [];
  const valores: (string | number | boolean)[] = [];
  if (cambios.role !== undefined) { sets.push("role = ?"); valores.push(cambios.role); }
  if (cambios.is_active !== undefined) { sets.push("is_active = ?"); valores.push(cambios.is_active); }
  const r = await ejecutar(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, [...valores, id]);
  if (!r.affectedRows) throw ErrorApi.noEncontrado("Ese usuario no existe.");
  return (await buscarPorId(id))!;
}
