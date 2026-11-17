// Relaciones entre tablas = claves foráneas (FOREIGN KEY) en MySQL.
// belongsTo pone la columna (clave foránea) en esta tabla; hasMany la pone en la otra (el ticket tiene muchos mensajes).
// "as" es el nombre con el que se piden en include (el populate de Mongoose).
const { sequelize } = require('../config/db');
const Usuario = require('./usuario.model');
const Sala = require('./sala.model');
const Categoria = require('./categoria.model');
const Reserva = require('./reserva.model');
const Ticket = require('./ticket.model');
const Mensaje = require('./mensaje.model');
const CambioEstado = require('./cambioEstado.model');

const fk = (name, allowNull = false) => ({ name, allowNull });

// Reservas: de un cliente y de una sala
Reserva.belongsTo(Usuario, { as: "cliente", foreignKey: fk("customer_id"), onDelete: "RESTRICT" });
Reserva.belongsTo(Sala, { as: "sala", foreignKey: fk("room_id"), onDelete: "RESTRICT" });

// Tickets: cliente, agente (opcional), categoría, sala (opcional) y reserva (opcional)
Ticket.belongsTo(Usuario, { as: "cliente", foreignKey: fk("customer_id"), onDelete: "RESTRICT" });
Ticket.belongsTo(Usuario, { as: "agente", foreignKey: fk("agent_id", true), onDelete: "SET NULL" });
Ticket.belongsTo(Categoria, { as: "categoria", foreignKey: fk("category_id"), onDelete: "RESTRICT" });
Ticket.belongsTo(Sala, { as: "sala", foreignKey: fk("room_id", true), onDelete: "SET NULL" });
Ticket.belongsTo(Reserva, { as: "reserva", foreignKey: fk("booking_id", true), onDelete: "SET NULL" });

// Mensajes e historial: si se borra el ticket, se borran con él (CASCADE)
Ticket.hasMany(Mensaje, { as: "mensajes", foreignKey: fk("ticket_id"), onDelete: "CASCADE" });
Mensaje.belongsTo(Usuario, { as: "autor", foreignKey: fk("author_id"), onDelete: "RESTRICT" });

Ticket.hasMany(CambioEstado, { as: "historial", foreignKey: fk("ticket_id"), onDelete: "CASCADE" });
CambioEstado.belongsTo(Usuario, { as: "autor", foreignKey: fk("changed_by_id"), onDelete: "RESTRICT" });

module.exports = { sequelize, Usuario, Sala, Categoria, Reserva, Ticket, Mensaje, CambioEstado };
