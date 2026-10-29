import { Router } from "express";
import * as c from "../controllers/tickets.controller";
import { autenticar } from "../middleware/autenticar";
import { permitir } from "../middleware/permitir";

export const rutasTickets = Router();

// Todas necesitan sesión. Lo que ve cada rol y la propiedad del ticket se comprueban en tickets.service.
rutasTickets.use(autenticar);

rutasTickets.get("/", c.listar);
rutasTickets.post("/", permitir("cliente", "admin"), c.crear);
rutasTickets.get("/:id", c.detalle);
rutasTickets.post("/:id/messages", c.responder);
rutasTickets.patch("/:id/status", c.cambiarEstado);
rutasTickets.patch("/:id/assign", permitir("agente", "admin"), c.asignar);
rutasTickets.patch("/:id", permitir("agente", "admin"), c.actualizar);
