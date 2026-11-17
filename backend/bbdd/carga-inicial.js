// Crea las tablas de NoExitRooms y las llena con los datos de ejemplo de bbdd/datos.js.
// Uso: npm run carga   ·   OJO: borra y vuelve a crear todas las tablas de la base de datos del .env.
const { sequelize, Usuario, Sala, Categoria, Reserva, Ticket, Mensaje, CambioEstado } = require("../model");
const { desconectar } = require("../config/db");
const datos = require("./datos");

async function cargaInicial() {
  // sync({ force: true }) = DROP TABLE + CREATE TABLE de cada modelo, con sus claves primarias,
  // foráneas e índices únicos (el mismo esquema que docs/05_esquema_mysql.sql)
  await sequelize.sync({ force: true });

  await Usuario.bulkCreate(datos.usuarios);
  await Sala.bulkCreate(datos.salas);
  await Categoria.bulkCreate(datos.categorias);
  await Reserva.bulkCreate(datos.reservas);

  // silent: true para que se queden las fechas de los ejemplos y no la de hoy
  await Ticket.bulkCreate(datos.tickets.map(({ mensajes, historial, ...ticket }) => ticket), { silent: true });
  await Mensaje.bulkCreate(datos.tickets.flatMap(t => t.mensajes.map(m => ({ ...m, ticket_id: t.id }))), { silent: true });
  await CambioEstado.bulkCreate(datos.tickets.flatMap(t => t.historial.map(h => ({ ...h, ticket_id: t.id }))), { silent: true });
}

cargaInicial()
  .then(async () => {
    const [usuarios, salas, tickets] = await Promise.all([Usuario.count(), Sala.count(), Ticket.count()]);
    console.log(`Carga completa en "${sequelize.config.database}": ${usuarios} usuarios, ${salas} salas y ${tickets} tickets.`);
    await desconectar();
  })
  .catch(async err => {
    console.error("No se pudo hacer la carga inicial:", err.message);
    await desconectar();
    process.exit(1);
  });
