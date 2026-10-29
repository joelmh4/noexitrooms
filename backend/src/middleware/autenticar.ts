// Exige un token válido en "Authorization: Bearer <token>". Si falta o ha caducado → 401.
// El usuario se vuelve a leer de la base de datos: si un admin le ha cambiado el rol o lo ha desactivado,
// manda lo que hay en la base de datos, no lo que decía el token.
import type { RequestHandler } from "express";
import { leerToken } from "../services/auth.service";
import { buscarPorId } from "../services/usuarios.service";
import { ErrorApi } from "./errores";

export const autenticar: RequestHandler = async (req, _res, next) => {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");
  if (tipo !== "Bearer" || !token) return next(ErrorApi.sinSesion());
  const { sub } = leerToken(token);
  const usuario = await buscarPorId(Number(sub));
  if (!usuario) return next(ErrorApi.sinSesion("Tu cuenta ya no existe."));
  if (!usuario.is_active) return next(ErrorApi.prohibido("Esta cuenta está desactivada."));
  req.usuario = usuario;
  next();
};
