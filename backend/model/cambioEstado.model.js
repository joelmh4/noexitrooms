const mongoose = require('mongoose');
const { ESTADOS } = require('./ticket.model');

// Colección historial_estados: cada cambio de estado de un ticket, con quién y cuándo
const appHistorialSchema = new mongoose.Schema({
    ticket_id: {
        type: Number,
        ref: "ticket",
        required: true
    },
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
    }
},
    {
        timestamps: { createdAt: "changed_at", updatedAt: false },
        versionKey: false
    })

const CambioEstado = mongoose.model("cambioEstado", appHistorialSchema, "historial_estados");

module.exports = CambioEstado;
