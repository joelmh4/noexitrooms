// Todas las rutas de la API cuelgan de /api. Cada módulo (auth, rooms, tickets...) tendrá su archivo aquí.
import { Router } from "express";
import { salud } from "../controllers/salud.controller";

export const rutas = Router();

rutas.get("/health", salud);
