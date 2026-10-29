// POST /auth/register y POST /auth/login
import type { RequestHandler } from "express";
import * as auth from "../services/auth.service";
import { comprobar, email, passwordNueva, texto, type Errores } from "../services/validacion";

export const registro: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const datos = {
    name: texto(errores, "name", req.body?.name, { min: 2, max: 100, nombre: "El nombre" }),
    email: email(errores, req.body?.email),
    password: passwordNueva(errores, "password", req.body?.password)
  };
  comprobar(errores);
  // req.body.role se ignora a propósito: nadie puede registrarse como agente o admin
  res.status(201).json(await auth.registrar(datos));
};

export const login: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const correo = email(errores, req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!password) errores.password = "Escribe tu contraseña.";
  comprobar(errores);
  res.json(await auth.login(correo, password));
};
