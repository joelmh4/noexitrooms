// Crea la base de datos de NoExitRooms con los datos de ejemplo de bbdd/datos.js.
// Uso: npm run carga   ·   OJO: borra todo lo que haya en la base de datos del .env (MONGO_URL).
const mongoose = require("mongoose");
const { conectar, desconectar } = require("../config/db");
const Usuario = require("../model/usuario.model");
const Sala = require("../model/sala.model");
const Categoria = require("../model/categoria.model");
const Reserva = require("../model/reserva.model");
const Ticket = require("../model/ticket.model");
const { Contador } = require("../model/contador.model");
const datos = require("./datos");

async function cargaInicial() {
  // Empezamos de cero: se borra la base de datos entera
  await mongoose.connection.dropDatabase();

  // Crea las colecciones y sus índices (email único, nombre de sala único, una reserva por hueco...)
  const modelos = [Usuario, Sala, Categoria, Reserva, Ticket, Contador];
  for (const modelo of modelos) await modelo.createCollection();
  await Promise.all(modelos.map(modelo => modelo.syncIndexes()));

  await Usuario.insertMany(datos.usuarios);
  await Sala.insertMany(datos.salas);
  await Categoria.insertMany(datos.categorias);
  await Reserva.insertMany(datos.reservas);
  // timestamps: false para que se queden las fechas de los ejemplos y no la de hoy
  await Ticket.insertMany(datos.tickets, { timestamps: false });

  // Los contadores siguen por el último id: el siguiente ticket será el 6 (NXR-0006)
  await Contador.insertMany([
    { _id: "usuario", seq: datos.usuarios.length },
    { _id: "sala", seq: datos.salas.length },
    { _id: "categoria", seq: datos.categorias.length },
    { _id: "reserva", seq: datos.reservas.length },
    { _id: "ticket", seq: datos.tickets.length }
  ]);
}

conectar()
  .then(cargaInicial)
  .then(async () => {
    const [usuarios, salas, tickets] = await Promise.all([Usuario.countDocuments(), Sala.countDocuments(), Ticket.countDocuments()]);
    console.log(`Carga completa en "${mongoose.connection.name}": ${usuarios} usuarios, ${salas} salas y ${tickets} tickets.`);
    await desconectar();
  })
  .catch(async err => {
    console.error("No se pudo hacer la carga inicial:", err.message);
    await desconectar();
    process.exit(1);
  });
