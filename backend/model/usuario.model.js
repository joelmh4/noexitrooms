const mongoose = require('mongoose');
const { idNumerico } = require('./contador.model');

const ROLES = ["cliente", "agente", "admin"];

const usuarioSchema = new mongoose.Schema({
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
        //minúsculas y sin espacios delante y detrás
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "El email no es válido"]
    },
    password: {
        type: String,
        required: true,
        //con select: false la contraseña (su hash de bcrypt) no sale en las consultas
        select: false
    },
    role: {
        type: String,
        required: true,
        //enum: el registro público siempre crea "cliente"; agentes y admins los nombra un admin
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
    }
)

usuarioSchema.plugin(idNumerico, { nombre: "usuario", ocultar: ["password"] });

const Usuario = mongoose.model("usuario", usuarioSchema);

module.exports = Usuario;
module.exports.ROLES = ROLES;
