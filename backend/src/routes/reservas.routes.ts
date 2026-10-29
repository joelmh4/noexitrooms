import { Router } from "express";
import * as c from "../controllers/reservas.controller";
import { autenticar } from "../middleware/autenticar";
import { permitir } from "../middleware/permitir";

export const rutasReservas = Router();

rutasReservas.use(autenticar);

rutasReservas.post("/", permitir("cliente"), c.crear);
rutasReservas.get("/me", permitir("cliente"), c.mias);
rutasReservas.get("/", permitir("agente", "admin"), c.listar);
// El cliente solo puede cancelar las suyas (se comprueba en reservas.service)
rutasReservas.patch("/:id/status", c.cambiarEstado);
