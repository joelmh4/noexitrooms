// Perfil propio (/users/me) y gestión de usuarios por el administrador (/users)
import type { RequestHandler } from "express";
import { ErrorApi } from "../middleware/errores";
import { ROLES, type Rol } from "../models/tipos";
import * as usuarios from "../services/usuarios.service";
import { comprobar, email, idDeRuta, passwordNueva, texto, unoDe, type Errores } from "../services/validacion";

export const yo: RequestHandler = (req, res) => {
  res.json(req.usuario);
};

export const actualizarYo: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const datos = {
    name: texto(errores, "name", req.body?.name, { min: 2, max: 100, nombre: "El nombre" }),
    email: email(errores, req.body?.email)
  };
  comprobar(errores);
  res.json(await usuarios.actualizarPerfil(req.usuario!.id, datos));
};

export const cambiarMiPassword: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const actual = typeof req.body?.actual === "string" ? req.body.actual : "";
  if (!actual) errores.actual = "Escribe tu contraseña actual.";
  const nueva = passwordNueva(errores, "nueva", req.body?.nueva);
  comprobar(errores);
  await usuarios.cambiarPassword(req.usuario!.id, actual, nueva);
  res.status(204).end();
};

// GET /users?role=&q=  · el admin ve a todos; el agente solo puede pedir la lista de agentes (para asignarse tickets)
export const listar: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const role = req.query.role ? unoDe(errores, "role", req.query.role, ROLES) : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : undefined;
  comprobar(errores);
  if (req.usuario!.role === "agente" && role !== "agente") throw ErrorApi.prohibido("Solo puedes consultar la lista de agentes.");
  res.json(await usuarios.listar({ role, q, soloActivos: req.usuario!.role === "agente" }));
};

// PATCH /users/:id { role?, is_active? } · solo admin
export const actualizar: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  const errores: Errores = {};
  const cambios: { role?: Rol; is_active?: boolean } = {};
  if (req.body?.role !== undefined) cambios.role = unoDe(errores, "role", req.body.role, ROLES);
  if (req.body?.is_active !== undefined) {
    if (typeof req.body.is_active !== "boolean") errores.is_active = "Tiene que ser true o false.";
    else cambios.is_active = req.body.is_active;
  }
  if (!Object.keys(cambios).length && !Object.keys(errores).length) errores.cambios = "Envía role o is_active.";
  comprobar(errores);
  // Un admin no puede quitarse a sí mismo el rol ni desactivarse: la web se quedaría sin nadie que la administre
  if (id === req.usuario!.id) throw ErrorApi.conflicto("No puedes cambiar tu propio rol ni desactivar tu cuenta.");
  res.json(await usuarios.actualizarComoAdmin(id, cambios));
};
