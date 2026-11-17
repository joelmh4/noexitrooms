const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla categorias: tipos de ticket. No se borran: se desactivan,
// así los tickets antiguos siguen teniendo su categoría.
const Categoria = sequelize.define('categoria', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        field: "nombre",
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: "uq_categorias_nombre"
    },
    is_active: {
        field: "activa",
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
},
    {
        tableName: "categorias",
        timestamps: false
    })

module.exports = Categoria;
