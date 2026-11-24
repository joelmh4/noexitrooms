const mongoose = require('mongoose');
const { idNumerico } = require('./contador.model');

const ROLES = ["cliente", "agente", "admin"];

// Colección usuarios. El registro público siempre crea "cliente"; agentes y admins los nombra un admin.
const appUsuariosSchema = new mongoose.Schema({
    _id: Number,
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        //El email no se puede repetir
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "El email no es válido"]
    },
    //Solo el hash de bcrypt, nunca la contraseña en texto plano. Con select: false no sale en las consultas
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ROLES,
        default: "cliente"
    },
    is_active: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        versionKey: false
    })

appUsuariosSchema.plugin(idNumerico, { nombre: "usuarios", ocultar: ["password", "updated_at"] });

const Usuario = mongoose.model("usuario", appUsuariosSchema);

module.exports = Usuario;
module.exports.ROLES = ROLES;
