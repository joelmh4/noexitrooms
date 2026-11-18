const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla mensajes: la conversación de cada ticket (ticket_id y author_id en model/index.js)
const Mensaje = sequelize.define('mensaje', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    body: {
        field: "texto",
        type: DataTypes.TEXT,
        allowNull: false
    },
    //Nota interna del equipo: el cliente nunca la recibe
    is_internal: {
        field: "nota_interna",
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        field: "creado_en",
        allowNull: false
    }
},
    {
        tableName: "mensajes",
        updatedAt: false
    })

module.exports = Mensaje;
