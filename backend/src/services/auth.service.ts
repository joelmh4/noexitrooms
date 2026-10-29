// Registro, login y tokens. La contraseña se compara con bcrypt; el token JWT solo lleva el id y el rol.
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { entorno } from "../config/entorno";
import { ErrorApi } from "../middleware/errores";
import type { Rol, UsuarioPublico } from "../models/tipos";
import * as usuarios from "./usuarios.service";

export interface ContenidoToken {
  sub: string;
  role: Rol;
}

export function firmarToken(u: UsuarioPublico): string {
  const opciones: SignOptions = { expiresIn: entorno.jwt.caduca as SignOptions["expiresIn"] };
  return jwt.sign({ role: u.role }, entorno.jwt.secreto, { ...opciones, subject: String(u.id) });
}

export function leerToken(token: string): ContenidoToken {
  try {
    return jwt.verify(token, entorno.jwt.secreto) as ContenidoToken;
  } catch {
    throw ErrorApi.sinSesion("La sesión no es válida o ha caducado. Vuelve a iniciar sesión.");
  }
}

// Hash de relleno: si el email no existe comparamos igual, para que la respuesta tarde lo mismo
// y no se pueda averiguar qué emails están registrados midiendo el tiempo
const HASH_RELLENO = bcrypt.hashSync("relleno-no-valido", usuarios.COSTE_BCRYPT);

export async function login(email: string, password: string): Promise<{ token: string; usuario: UsuarioPublico }> {
  const u = await usuarios.buscarConHash(email);
  const correcta = await bcrypt.compare(password, u?.password_hash ?? HASH_RELLENO);
  if (!u || !correcta) throw ErrorApi.sinSesion("El email o la contraseña no son correctos.");
  if (!u.is_active) throw ErrorApi.prohibido("Esta cuenta está desactivada. Escríbenos desde Contacto.");
  const usuario: UsuarioPublico = { id: u.id, name: u.name, email: u.email, role: u.role, is_active: u.is_active, created_at: u.created_at };
  return { token: firmarToken(usuario), usuario };
}

export async function registrar(datos: { name: string; email: string; password: string }) {
  const usuario = await usuarios.crearCliente(datos);
  return { token: firmarToken(usuario), usuario };
}
