const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ROLES = ["cliente", "agente", "admin"];

// Tabla usuarios. El registro público siempre crea "cliente"; agentes y admins los nombra un admin.
const Usuario = sequelize.define('usuario', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        field: "nombre",
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { len: [2, 100] }
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        //El email no se puede repetir
        unique: "uq_usuarios_email",
        validate: { isEmail: true }
    },
    //Solo el hash de bcrypt, nunca la contraseña en texto plano
    password_hash: {
        field: "hash_contrasena",
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        field: "rol",
        //ENUM: no se puede guardar otro rol que no sea uno de estos
        type: DataTypes.ENUM(...ROLES),
        allowNull: false,
        defaultValue: "cliente"
    },
    is_active: {
        field: "activo",
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        field: "creado_en",
        allowNull: false
    },
    updated_at: {
        type: DataTypes.DATE,
        field: "actualizado_en",
        allowNull: false
    }
},
    {
        tableName: "usuarios",
        //Por defecto las consultas NO traen el hash (como select: false en Mongoose)
        defaultScope: { attributes: { exclude: ["password_hash"] } },
        scopes: { conPassword: { attributes: { include: ["password_hash"] } } }
    })

// Al enviarlo como JSON, el hash nunca sale aunque se haya leído
Usuario.prototype.toJSON = function () {
    const { password_hash, updated_at, ...datos } = this.get();
    return datos;
};

module.exports = Usuario;
module.exports.ROLES = ROLES;
