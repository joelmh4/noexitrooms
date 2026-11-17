// Errores de la API con el mismo formato siempre: { error: { codigo, mensaje, campos? } }
// Express 5 manda aquí cualquier error lanzado dentro de un controlador async, sin try/catch.

class ErrorApi extends Error {
  constructor(status, codigo, mensaje, campos) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
  }

  static datosInvalidos(campos) {
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
  static conflicto(mensaje) {
    return new ErrorApi(409, "CONFLICTO", mensaje);
  }
}

// Ruta que no existe
const rutaNoEncontrada = (req, res, next) => {
  next(ErrorApi.noEncontrado(`La ruta ${req.method} ${req.originalUrl} no existe.`));
};

// Último middleware: convierte cualquier error en una respuesta JSON
const manejarErrores = (err, req, res, next) => {
  if (err instanceof ErrorApi) {
    return res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message, campos: err.campos } });
  }
  // JSON mal formado en el cuerpo de la petición
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { codigo: "JSON_INVALIDO", mensaje: "El cuerpo de la petición no es JSON válido." } });
  }
  // Clave única repetida en MySQL (email, nombre de sala...)
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ error: { codigo: "DUPLICADO", mensaje: "Ya existe un registro con ese valor." } });
  }
  // Clave foránea: se intenta borrar algo que otros registros usan, o enlazar con algo que no existe
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({ error: { codigo: "CONFLICTO", mensaje: "Ese registro está relacionado con otros datos." } });
  }
  // Las validaciones de los modelos de Sequelize (allowNull, min, max, isEmail...)
  if (err.name === "SequelizeValidationError") {
    const campos = {};
    for (const detalle of err.errors) campos[detalle.path] = detalle.message;
    return res.status(400).json({ error: { codigo: "DATOS_INVALIDOS", mensaje: "Revisa los datos enviados.", campos } });
  }
  // Error inesperado: se apunta en el servidor y al cliente no se le dan detalles técnicos
  console.error(err);
  res.status(500).json({ error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor. Inténtalo más tarde." } });
};

module.exports = { ErrorApi, rutaNoEncontrada, manejarErrores };
