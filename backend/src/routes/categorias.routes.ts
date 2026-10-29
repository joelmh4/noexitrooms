import { Router } from "express";
import * as c from "../controllers/categorias.controller";
import { autenticar } from "../middleware/autenticar";
import { permitir } from "../middleware/permitir";

export const rutasCategorias = Router();

// Pública; solo con ?all=1 exige sesión (y el controlador comprueba que sea admin)
rutasCategorias.get("/", (req, res, next) => (c.pideTodas(req.query.all) ? autenticar(req, res, next) : next()), c.listar);
rutasCategorias.post("/", autenticar, permitir("admin"), c.crear);
rutasCategorias.put("/:id", autenticar, permitir("admin"), c.actualizar);
