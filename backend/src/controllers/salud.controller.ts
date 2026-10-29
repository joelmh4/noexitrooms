// Comprobación de que la API está viva y llega a la base de datos (útil tras desplegar)
import type { RequestHandler } from "express";
import { consultar } from "../db/conexion";

export const salud: RequestHandler = async (_req, res) => {
  let baseDeDatos = "ok";
  try {
    await consultar("SELECT 1");
  } catch {
    baseDeDatos = "sin conexión";
  }
  res.status(baseDeDatos === "ok" ? 200 : 503).json({ api: "ok", baseDeDatos, hora: new Date().toISOString() });
};
