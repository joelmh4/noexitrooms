const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla ticket_messages: la conversación de cada ticket (ticket_id y author_id en model/index.js)
const Mensaje = sequelize.define('mensaje', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    //Nota interna del equipo: el cliente nunca la recibe
    is_internal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},
    {
        tableName: "ticket_messages",
        updatedAt: false
    })

module.exports = Mensaje;
