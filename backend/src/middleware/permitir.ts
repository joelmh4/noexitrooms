// Deja pasar solo a los roles indicados. Va siempre después de autenticar. Rol no incluido → 403.
// Ejemplo: router.get("/users", autenticar, permitir("admin"), controlador)
import type { RequestHandler } from "express";
import type { Rol } from "../models/tipos";
import { ErrorApi } from "./errores";

export const permitir = (...roles: Rol[]): RequestHandler => (req, _res, next) => {
  if (!req.usuario) return next(ErrorApi.sinSesion());
  if (!roles.includes(req.usuario.role)) return next(ErrorApi.prohibido());
  next();
};
