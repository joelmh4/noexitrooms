const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla rooms: las salas de escape, la entidad del CRUD temático
const Sala = sequelize.define('sala', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: "uq_rooms_name"
    },
    //Para la URL de la ficha: "El manicomio de San Tomás" → el-manicomio-de-san-tomas
    slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: "uq_rooms_slug"
    },
    theme: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    difficulty: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1, max: 5 }
    },
    duration_min: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        validate: { min: 15, max: 180 }
    },
    min_players: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1 }
    },
    max_players: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1 }
    },
    price_per_person: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        validate: { min: 0 },
        //MySQL devuelve DECIMAL como texto: lo pasamos a número
        get() {
            const valor = this.getDataValue("price_per_person");
            return valor === null ? null : Number(valor);
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tagline: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    min_age: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: { max: 99 }
    },
    //Pruebas de la sala, una por línea
    challenges: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
},
    {
        tableName: "rooms",
        validate: {
            jugadoresCoherentes() {
                if (this.max_players < this.min_players) throw new Error("max_players no puede ser menor que min_players");
            }
        },
        indexes: [{ fields: ["theme"] }, { fields: ["is_active"] }]
    })

module.exports = Sala;
