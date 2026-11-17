const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla ticket_categories: tipos de ticket. No se borran: se desactivan,
// así los tickets antiguos siguen teniendo su categoría.
const Categoria = sequelize.define('categoria', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: "uq_ticket_categories_name"
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
},
    {
        tableName: "ticket_categories",
        timestamps: false
    })

module.exports = Categoria;
