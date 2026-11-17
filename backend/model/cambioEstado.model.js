const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { ESTADOS } = require('./ticket.model');

// Tabla ticket_status_history: cada cambio de estado de un ticket, con quién y cuándo
const CambioEstado = sequelize.define('cambioEstado', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    //null en el primer registro, cuando se crea el ticket
    old_status: {
        type: DataTypes.ENUM(...ESTADOS),
        allowNull: true
    },
    new_status: {
        type: DataTypes.ENUM(...ESTADOS),
        allowNull: false
    }
},
    {
        tableName: "ticket_status_history",
        createdAt: "changed_at",
        updatedAt: false
    })

module.exports = CambioEstado;
