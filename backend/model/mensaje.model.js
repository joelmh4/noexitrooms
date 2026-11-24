const mongoose = require('mongoose');

// Colección mensajes: la conversación de cada ticket
const appMensajesSchema = new mongoose.Schema({
    ticket_id: {
        type: Number,
        ref: "ticket",
        required: true
    },
    author_id: {
        type: Number,
        ref: "usuario",
        required: true
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    //Nota interna del equipo: el cliente nunca la recibe
    is_internal: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
        versionKey: false
    })

const Mensaje = mongoose.model("mensaje", appMensajesSchema);

module.exports = Mensaje;
