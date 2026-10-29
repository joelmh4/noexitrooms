// Frena los intentos repetidos de login: como mucho 10 fallos cada 15 minutos por IP y email → 429.
// Se guarda en memoria: suficiente para un solo servidor como el de Render.
import type { RequestHandler } from "express";
import { ErrorApi } from "./errores";

const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLOS = 10;
const fallos = new Map<string, { veces: number; desde: number }>();

const claveDe = (ip: string | undefined, email: unknown) => `${ip}|${String(email ?? "").trim().toLowerCase()}`;

export const limitarIntentos: RequestHandler = (req, res, next) => {
  const clave = claveDe(req.ip, req.body?.email);
  const ahora = Date.now();
  const registro = fallos.get(clave);
  if (registro && ahora - registro.desde > VENTANA_MS) fallos.delete(clave);
  const actual = fallos.get(clave);
  if (actual && actual.veces >= MAX_FALLOS) {
    const minutos = Math.ceil((VENTANA_MS - (ahora - actual.desde)) / 60000);
    res.setHeader("Retry-After", String(minutos * 60));
    return next(new ErrorApi(429, "DEMASIADOS_INTENTOS", `Demasiados intentos. Prueba otra vez en ${minutos} min.`));
  }
  // Al terminar la respuesta: si falló, se cuenta; si entró, se borra el contador
  res.on("finish", () => {
    if (res.statusCode === 401) {
      const r = fallos.get(clave) ?? { veces: 0, desde: ahora };
      r.veces++;
      fallos.set(clave, r);
    } else if (res.statusCode < 400) fallos.delete(clave);
  });
  next();
};
