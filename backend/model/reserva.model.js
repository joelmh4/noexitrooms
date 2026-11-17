const mongoose = require('mongoose');
const { idNumerico } = require('./contador.model');

const ESTADOS_RESERVA = ["pendiente", "confirmada", "cancelada"];

// Reservas (mejora opcional del enunciado). La hora es "de reloj" en Madrid y se guarda
// como texto AAAA-MM-DDTHH:MM:SS: así se compara y se ordena fácil y nunca cambia con la zona horaria.
const reservaSchema = new mongoose.Schema({
    _id: Number,
    //ref: es el "join" de Mongoose. Con populate() se rellenan los datos del cliente y de la sala
    customer_id: {
        type: Number,
        ref: "usuario",
        required: true
    },
    room_id: {
        type: Number,
        ref: "sala",
        required: true
    },
    starts_at: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/
    },
    players: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ESTADOS_RESERVA,
        default: "pendiente"
    }
},
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
        versionKey: false
    })

//Una sala no puede tener dos reservas a la misma hora (índice único compuesto)
reservaSchema.index({ room_id: 1, starts_at: 1 }, { unique: true });

reservaSchema.plugin(idNumerico, { nombre: "reserva" });

const Reserva = mongoose.model('reserva', reservaSchema);

module.exports = Reserva;
module.exports.ESTADOS_RESERVA = ESTADOS_RESERVA;
