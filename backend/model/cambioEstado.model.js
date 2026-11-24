const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { ESTADOS } = require('./ticket.model');

// Tabla historial_estados: cada cambio de estado de un ticket, con quién y cuándo
const CambioEstado = sequelize.define('cambioEstado', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    //null en el primer registro, cuando se crea el ticket
    old_status: {
        field: "estado_anterior",
        type: DataTypes.ENUM(...ESTADOS),
        allowNull: true
    },
    new_status: {
        field: "estado_nuevo",
        type: DataTypes.ENUM(...ESTADOS),
        allowNull: false
    },
    changed_at: {
        type: DataTypes.DATE,
        field: "fecha_cambio",
        allowNull: false
    }
},
    {
        tableName: "historial_estados",
        createdAt: "changed_at",
        updatedAt: false
    })

module.exports = CambioEstado;
