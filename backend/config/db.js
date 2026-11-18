// Conexión a MySQL con Sequelize (el ORM: hace con MySQL lo que Mongoose hace con MongoDB).
// Sequelize siempre manda los valores aparte de la consulta (consultas parametrizadas): no hay inyección SQL.
const { Sequelize } = require("sequelize");
const entorno = require("./entorno");

const sequelize = new Sequelize(entorno.db.database, entorno.db.user, entorno.db.password, {
  host: entorno.db.host,
  port: entorno.db.port,
  dialect: "mysql",
  // Las fechas se guardan y se leen en UTC
  timezone: "+00:00",
  dialectOptions: entorno.db.ssl ? { ssl: { rejectUnauthorized: true, ca: entorno.db.ca } } : {},
  logging: false,
  define: {
    // Nombres de columna en snake_case (created_at, customer_id...) y sin pluralizar las tablas
    underscored: true,
    freezeTableName: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

const conectar = () => sequelize.authenticate();

const desconectar = () => sequelize.close();

module.exports = { sequelize, conectar, desconectar };
