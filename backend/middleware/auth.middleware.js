// Autenticación con JWT y permisos por rol (como verificarToken y permitirRoles del ejemplo de clase).
const jwt = require("jsonwebtoken");
const { Usuario } = require("../model");
const entorno = require("../config/entorno");
const { ErrorApi } = require("./errores.middleware");

// Exige "Authorization: Bearer <token>". Sin token o caducado → 401.
// El usuario se vuelve a leer de la base de datos: si un admin le ha cambiado el rol
// o lo ha desactivado, manda lo que hay en la base de datos, no lo que decía el token.
const verificarToken = async (req, res, next) => {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) return next(ErrorApi.sinSesion());

  let tokenVerificado;
  try {
    tokenVerificado = jwt.verify(token, entorno.token.password);
  } catch {
    return next(ErrorApi.sinSesion("La sesión no es válida o ha caducado. Vuelve a iniciar sesión."));
  }

  const usuario = await Usuario.findByPk(tokenVerificado.id);
  if (!usuario) return next(ErrorApi.sinSesion("Tu cuenta ya no existe."));
  if (!usuario.is_active) return next(ErrorApi.prohibido("Esta cuenta está desactivada."));

  req.usuario = usuario.toJSON(); // { id, name, email, role, is_active, created_at }
  next();
};

// Para rutas públicas que cambian algo si hay sesión (por ejemplo, marcar "tuya" una hora reservada)
const sesionOpcional = (req, res, next) =>
  req.headers.authorization ? verificarToken(req, res, next) : next();

// Deja pasar solo a los roles indicados. Va siempre después de verificarToken. Rol no incluido → 403.
// Ejemplo: ruta.get("/", verificarToken, permitirRoles("admin"), controlador)
const permitirRoles = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) return next(ErrorApi.sinSesion());
  if (!rolesPermitidos.includes(req.usuario.role)) return next(ErrorApi.prohibido());
  next();
};

// Crea el token al registrarse o iniciar sesión: solo lleva el id y el rol
const firmarToken = usuario =>
  jwt.sign({ id: usuario.id, role: usuario.role }, entorno.token.password, { expiresIn: entorno.token.caduca });

module.exports = { verificarToken, sesionOpcional, permitirRoles, firmarToken };
