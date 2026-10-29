// Errores de la API con el mismo formato siempre: { error: { codigo, mensaje, campos? } }
import type { ErrorRequestHandler, RequestHandler } from "express";

export class ErrorApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly campos?: Record<string, string>
  ) {
    super(mensaje);
  }

  static datosInvalidos(campos: Record<string, string>) {
    return new ErrorApi(400, "DATOS_INVALIDOS", "Revisa los datos enviados.", campos);
  }
  static sinSesion(mensaje = "Inicia sesión para continuar.") {
    return new ErrorApi(401, "SIN_SESION", mensaje);
  }
  static prohibido(mensaje = "No tienes permiso para hacer esto.") {
    return new ErrorApi(403, "PROHIBIDO", mensaje);
  }
  static noEncontrado(mensaje = "No existe o no tienes acceso.") {
    return new ErrorApi(404, "NO_ENCONTRADO", mensaje);
  }
  static conflicto(mensaje: string) {
    return new ErrorApi(409, "CONFLICTO", mensaje);
  }
}

// Ruta que no existe
export const rutaNoEncontrada: RequestHandler = (req, _res, next) => {
  next(ErrorApi.noEncontrado(`La ruta ${req.method} ${req.originalUrl} no existe.`));
};

// Último middleware: convierte cualquier error en una respuesta JSON coherente
export const manejarErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ErrorApi) {
    res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message, campos: err.campos } });
    return;
  }
  // JSON mal formado en el cuerpo de la petición
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { codigo: "JSON_INVALIDO", mensaje: "El cuerpo de la petición no es JSON válido." } });
    return;
  }
  // Clave única duplicada en MySQL (email, nombre de sala...)
  if (err?.code === "ER_DUP_ENTRY") {
    res.status(409).json({ error: { codigo: "DUPLICADO", mensaje: "Ya existe un registro con ese valor." } });
    return;
  }
  // Error inesperado: se registra en el servidor y al cliente no se le dan detalles técnicos
  console.error(err);
  res.status(500).json({ error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor. Inténtalo más tarde." } });
};
