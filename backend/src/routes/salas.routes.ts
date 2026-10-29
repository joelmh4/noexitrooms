import { Router } from "express";
import * as c from "../controllers/salas.controller";
import { autenticar, sesionOpcional } from "../middleware/autenticar";
import { permitir } from "../middleware/permitir";

export const rutasSalas = Router();

// Públicas. Con sesión, ?all=1 (admin) y la marca "tuya" en los huecos.
rutasSalas.get("/", sesionOpcional, c.listar);
rutasSalas.get("/:id/slots", sesionOpcional, c.huecos);
rutasSalas.get("/:slug", c.detalle);

rutasSalas.post("/", autenticar, permitir("admin"), c.crear);
rutasSalas.put("/:id", autenticar, permitir("admin"), c.actualizar);
rutasSalas.delete("/:id", autenticar, permitir("admin"), c.borrar);
