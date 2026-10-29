import { Router } from "express";
import { login, registro } from "../controllers/auth.controller";
import { limitarIntentos } from "../middleware/limitarIntentos";

export const rutasAuth = Router();

rutasAuth.post("/register", registro);
rutasAuth.post("/login", limitarIntentos, login);
