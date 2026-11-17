// Comprobaciones de los datos que llegan en las peticiones. Cada función devuelve el valor limpio
// o apunta el error en `errores`; al final, comprobar() lanza un 400 con todos los campos a la vez.
const { ErrorApi } = require("../middleware/errores.middleware");

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(errores, campo, valor, { min = 1, max = 255, nombre = campo } = {}) {
  const limpio = typeof valor === "string" ? valor.trim() : "";
  if (limpio.length < min) errores[campo] = min <= 1 ? `Falta ${nombre}.` : `${nombre} necesita al menos ${min} caracteres.`;
  else if (limpio.length > max) errores[campo] = `${nombre} no puede pasar de ${max} caracteres.`;
  return limpio;
}

function email(errores, valor) {
  const limpio = typeof valor === "string" ? valor.trim().toLowerCase() : "";
  if (!EMAIL_VALIDO.test(limpio)) errores.email = "Escribe un email válido.";
  else if (limpio.length > 150) errores.email = "El email no puede pasar de 150 caracteres.";
  return limpio;
}

// Misma regla que el formulario de registro: mínimo 8 caracteres y al menos un número
function passwordNueva(errores, campo, valor) {
  const clave = typeof valor === "string" ? valor : "";
  if (clave.length < 8 || !/\d/.test(clave)) errores[campo] = "Mínimo 8 caracteres y al menos un número.";
  else if (clave.length > 72) errores[campo] = "La contraseña no puede pasar de 72 caracteres."; // límite de bcrypt
  return clave;
}

function unoDe(errores, campo, valor, opciones) {
  if (!opciones.includes(valor)) errores[campo] = `Valor no válido. Opciones: ${opciones.join(", ")}.`;
  return valor;
}

// Entero dentro de un rango
function entero(errores, campo, valor, min, max, mensaje) {
  const n = Number(valor);
  if (valor === "" || valor === null || valor === undefined || !Number.isInteger(n) || n < min || n > max) errores[campo] = mensaje;
  return n;
}

// Id numérico opcional (en el cuerpo o en la query)
function idOpcional(errores, campo, valor) {
  if (valor === undefined || valor === null || valor === "") return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    errores[campo] = "Tiene que ser un número de id.";
    return undefined;
  }
  return n;
}

// El :id de la URL. Si no es un número, el recurso no existe → 404
function idDeRuta(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw ErrorApi.noEncontrado();
  return id;
}

function comprobar(errores) {
  if (Object.keys(errores).length) throw ErrorApi.datosInvalidos(errores);
}

// Para buscar texto con una expresión regular sin que los caracteres especiales cambien la búsqueda
const buscarTexto = q => new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const pideTodas = valor => valor === "1" || valor === "true";

module.exports = { texto, email, passwordNueva, unoDe, entero, idOpcional, idDeRuta, comprobar, buscarTexto, pideTodas };
