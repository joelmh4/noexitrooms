// Comprobaciones de datos de entrada. Cada función devuelve el valor limpio o apunta el error en `errores`;
// al final, si hay alguno, se lanza un 400 con todos los campos a la vez (como hacen los formularios del frontend).
import { ErrorApi } from "../middleware/errores";

export type Errores = Record<string, string>;

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function texto(errores: Errores, campo: string, valor: unknown, { min = 1, max = 255, nombre = campo } = {}): string {
  const limpio = typeof valor === "string" ? valor.trim() : "";
  if (limpio.length < min) errores[campo] = min <= 1 ? `Falta ${nombre}.` : `${nombre} necesita al menos ${min} caracteres.`;
  else if (limpio.length > max) errores[campo] = `${nombre} no puede pasar de ${max} caracteres.`;
  return limpio;
}

export function email(errores: Errores, valor: unknown): string {
  const limpio = typeof valor === "string" ? valor.trim().toLowerCase() : "";
  if (!EMAIL_VALIDO.test(limpio)) errores.email = "Escribe un email válido.";
  else if (limpio.length > 150) errores.email = "El email no puede pasar de 150 caracteres.";
  return limpio;
}

// Misma regla que el formulario de registro: mínimo 8 caracteres y al menos un número
export function passwordNueva(errores: Errores, campo: string, valor: unknown): string {
  const clave = typeof valor === "string" ? valor : "";
  if (clave.length < 8 || !/\d/.test(clave)) errores[campo] = "Mínimo 8 caracteres y al menos un número.";
  else if (clave.length > 72) errores[campo] = "La contraseña no puede pasar de 72 caracteres."; // límite de bcrypt
  return clave;
}

export function unoDe<T extends string>(errores: Errores, campo: string, valor: unknown, opciones: readonly T[]): T {
  if (!opciones.includes(valor as T)) errores[campo] = `Valor no válido. Opciones: ${opciones.join(", ")}.`;
  return valor as T;
}

export function idDeRuta(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw ErrorApi.noEncontrado();
  return id;
}

export function comprobar(errores: Errores): void {
  if (Object.keys(errores).length) throw ErrorApi.datosInvalidos(errores);
}
