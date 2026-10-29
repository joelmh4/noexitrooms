// GET /categories es público (el formulario de nuevo ticket lo necesita); crear y editar, solo admin
import type { RequestHandler } from "express";
import * as categorias from "../services/categorias.service";
import { ErrorApi } from "../middleware/errores";
import { comprobar, idDeRuta, texto, type Errores } from "../services/validacion";

export const pideTodas = (valor: unknown) => valor === "1" || valor === "true";

// GET /categories · GET /categories?all=1 (también las desactivadas, solo admin)
export const listar: RequestHandler = async (req, res) => {
  const todas = pideTodas(req.query.all);
  if (todas && req.usuario?.role !== "admin") throw ErrorApi.prohibido();
  res.json(await categorias.listar(todas));
};

export const crear: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const name = texto(errores, "name", req.body?.name, { min: 3, max: 80, nombre: "El nombre" });
  comprobar(errores);
  res.status(201).json(await categorias.crear(name));
};

// PUT /categories/:id { name?, is_active? }
export const actualizar: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  const errores: Errores = {};
  const cambios: { name?: string; is_active?: boolean } = {};
  if (req.body?.name !== undefined) cambios.name = texto(errores, "name", req.body.name, { min: 3, max: 80, nombre: "El nombre" });
  if (req.body?.is_active !== undefined) {
    if (typeof req.body.is_active !== "boolean") errores.is_active = "Tiene que ser true o false.";
    else cambios.is_active = req.body.is_active;
  }
  if (!Object.keys(cambios).length && !Object.keys(errores).length) errores.cambios = "Envía name o is_active.";
  comprobar(errores);
  res.json(await categorias.actualizar(id, cambios));
};
