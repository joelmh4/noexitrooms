const mongoose = require('mongoose');
const { idNumerico } = require('./contador.model');

const ESTADOS = ["abierto", "en_curso", "pendiente_cliente", "resuelto", "cerrado"];
const PRIORIDADES = ["baja", "media", "alta"];

// Los mensajes y el historial de estados van DENTRO del ticket (subdocumentos):
// se leen y se guardan de una vez con el ticket, sin consultas aparte.
const mensajeSchema = new mongoose.Schema({
    author_id: {
        type: Number,
        ref: "usuario",
        required: true
    },
    body: {
        type: String,
        required: true
    },
    //Nota interna del equipo: el cliente nunca la recibe
    is_internal: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

const cambioEstadoSchema = new mongoose.Schema({
    changed_by_id: {
        type: Number,
        ref: "usuario",
        required: true
    },
    //null en el primer registro, cuando se crea el ticket
    old_status: {
        type: String,
        enum: [...ESTADOS, null],
        default: null
    },
    new_status: {
        type: String,
        enum: ESTADOS,
        required: true
    },
    changed_at: {
        type: Date,
        default: Date.now
    }
})

const ticketSchema = new mongoose.Schema({
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
    },
    mensajes: [mensajeSchema],
    historial: [cambioEstadoSchema]
},
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        versionKey: false
    })

ticketSchema.index({ customer_id: 1 });
ticketSchema.index({ agent_id: 1 });
ticketSchema.index({ status: 1 });

ticketSchema.plugin(idNumerico, { nombre: "ticket" });

const Ticket = mongoose.model('ticket', ticketSchema);

// Código visible del ticket: NXR-0042
const codigoTicket = (id) => `NXR-${String(id).padStart(4, "0")}`;

module.exports = Ticket;
module.exports.ESTADOS = ESTADOS;
module.exports.PRIORIDADES = PRIORIDADES;
module.exports.codigoTicket = codigoTicket;
