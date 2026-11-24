// Escribe en la consola cada petición que llega (como en el ejemplo de clase)
const logger = (req, res, next) => {
  console.log("Método:", req.method, "· URL:", req.originalUrl);
  next();
};

module.exports = logger;
