const mongoose = require('mongoose');
const { idNumerico } = require('./contador.model');

const ESTADOS = ["abierto", "en_curso", "pendiente_cliente", "resuelto", "cerrado"];
const PRIORIDADES = ["baja", "media", "alta"];

// Colección tickets. Los mensajes y el historial de estados van en sus colecciones
// (mensajes e historial_estados) y apuntan al ticket con ticket_id.
const appTicketsSchema = new mongoose.Schema({
    _id: Number,
    customer_id: {
        type: Number,
        ref: "usuario",
        required: true
    },
    agent_id: {
        type: Number,
        ref: "usuario",
        default: null
    },
    category_id: {
        type: Number,
        ref: "categoria",
        required: true
    },
    room_id: {
        type: Number,
        ref: "sala",
        default: null
    },
    booking_id: {
        type: Number,
        ref: "reserva",
        default: null
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: PRIORIDADES,
        default: "media"
    },
    status: {
        type: String,
        enum: ESTADOS,
        default: "abierto"
    },
    closed_at: {
        type: Date,
        default: null
    }
},
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        versionKey: false
    })

appTicketsSchema.plugin(idNumerico, { nombre: "tickets" });

const Ticket = mongoose.model("ticket", appTicketsSchema);

// Código visible del ticket: NXR-0042
const codigoTicket = (id) => `NXR-${String(id).padStart(4, "0")}`;

module.exports = Ticket;
module.exports.ESTADOS = ESTADOS;
module.exports.PRIORIDADES = PRIORIDADES;
module.exports.codigoTicket = codigoTicket;
