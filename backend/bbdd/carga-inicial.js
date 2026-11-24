// Crea la base de datos de NoExitRooms con los datos de ejemplo de bbdd/datos.js.
// Uso: npm run carga   ·   OJO: borra todo lo que haya en la base de datos del .env (MONGO_URL).
const mongoose = require("mongoose");
const entorno = require("../config/entorno");
const Usuario = require("../model/usuario.model");
const Sala = require("../model/sala.model");
const Categoria = require("../model/categoria.model");
const Reserva = require("../model/reserva.model");
const Ticket = require("../model/ticket.model");
const Mensaje = require("../model/mensaje.model");
const CambioEstado = require("../model/cambioEstado.model");
const Contador = require("../model/contador.model");
const datos = require("./datos");

async function cargaInicial() {
    await mongoose.connect(entorno.mongoUrl);

    // Empezamos de cero: se borra la base de datos entera
    await mongoose.connection.dropDatabase();

    // Crea las colecciones y sus índices únicos (email, nombre de sala, una reserva por hueco...)
    const modelos = [Usuario, Sala, Categoria, Reserva, Ticket, Mensaje, CambioEstado, Contador];
    for (const modelo of modelos) {
        await modelo.createCollection();
        await modelo.syncIndexes();
    }

    await Usuario.insertMany(datos.usuarios);
    await Sala.insertMany(datos.salas);
    await Categoria.insertMany(datos.categorias);
    await Reserva.insertMany(datos.reservas);
    await Ticket.insertMany(datos.tickets);
    await Mensaje.insertMany(datos.mensajes);
    await CambioEstado.insertMany(datos.historial);

    // Los contadores siguen por el último id: el siguiente ticket será el 6 (NXR-0006)
    await Contador.insertMany([
        { _id: "usuarios", seq: datos.usuarios.length },
        { _id: "salas", seq: datos.salas.length },
        { _id: "categorias", seq: datos.categorias.length },
        { _id: "reservas", seq: datos.reservas.length },
        { _id: "tickets", seq: datos.tickets.length }
    ]);

    console.log(`Carga completa en "${mongoose.connection.name}": ${datos.usuarios.length} usuarios, ${datos.salas.length} salas y ${datos.tickets.length} tickets.`);
}

cargaInicial()
    .catch(err => {
        console.log("No se pudo hacer la carga inicial:", err.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
