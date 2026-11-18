const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ESTADOS = ["abierto", "en_curso", "pendiente_cliente", "resuelto", "cerrado"];
const PRIORIDADES = ["baja", "media", "alta"];

// Tabla tickets. Las claves foráneas (customer_id, agent_id, category_id, room_id, booking_id)
// se crean en model/index.js con las relaciones.
const Ticket = sequelize.define('ticket', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    subject: {
        field: "asunto",
        type: DataTypes.STRING(150),
        allowNull: false
    },
    description: {
        field: "descripcion",
        type: DataTypes.TEXT,
        allowNull: false
    },
    priority: {
        field: "prioridad",
        type: DataTypes.ENUM(...PRIORIDADES),
        allowNull: false,
        defaultValue: "media"
    },
    status: {
        field: "estado",
        type: DataTypes.ENUM(...ESTADOS),
        allowNull: false,
        defaultValue: "abierto"
    },
    closed_at: {
        field: "cerrado_en",
        type: DataTypes.DATE,
        allowNull: true
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
        tableName: "tickets",
        indexes: [{ fields: ["estado"] }, { fields: ["prioridad"] }]
    })

// Código visible del ticket: NXR-0042
const codigoTicket = (id) => `NXR-${String(id).padStart(4, "0")}`;

module.exports = Ticket;
module.exports.ESTADOS = ESTADOS;
module.exports.PRIORIDADES = PRIORIDADES;
module.exports.codigoTicket = codigoTicket;
