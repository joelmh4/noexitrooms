// Añade a la petición de Express el usuario que ha iniciado sesión (lo rellena el middleware autenticar)
import type { UsuarioPublico } from "../models/tipos";

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioPublico;
    }
  }
}

export {};
