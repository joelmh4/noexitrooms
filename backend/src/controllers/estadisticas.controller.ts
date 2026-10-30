import type { RequestHandler } from "express";
import { resumen } from "../services/estadisticas.service";

// GET /stats · agente (las suyas) o admin (todo el equipo)
export const estadisticas: RequestHandler = async (req, res) => {
  res.json(await resumen(req.usuario!));
};
