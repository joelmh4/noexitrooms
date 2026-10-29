import { Router } from "express";
import * as c from "../controllers/usuarios.controller";
import { autenticar } from "../middleware/autenticar";
import { permitir } from "../middleware/permitir";

export const rutasUsuarios = Router();

// Todas necesitan sesión
rutasUsuarios.use(autenticar);

rutasUsuarios.get("/me", c.yo);
rutasUsuarios.put("/me", c.actualizarYo);
rutasUsuarios.put("/me/password", c.cambiarMiPassword);

rutasUsuarios.get("/", permitir("admin", "agente"), c.listar);
rutasUsuarios.patch("/:id", permitir("admin"), c.actualizar);
