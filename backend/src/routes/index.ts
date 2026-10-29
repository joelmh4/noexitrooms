// Todas las rutas de la API cuelgan de /api. Cada módulo tiene su archivo.
import { Router } from "express";
import { salud } from "../controllers/salud.controller";
import { rutasAuth } from "./auth.routes";
import { rutasUsuarios } from "./usuarios.routes";

export const rutas = Router();

rutas.get("/health", salud);
rutas.use("/auth", rutasAuth);
rutas.use("/users", rutasUsuarios);
