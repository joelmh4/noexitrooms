const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla salas: las salas de escape, la entidad del CRUD temático
const Sala = sequelize.define('sala', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        field: "nombre",
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: "uq_salas_nombre"
    },
    //Para la URL de la ficha: "El manicomio de San Tomás" → el-manicomio-de-san-tomas
    slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: "uq_salas_slug"
    },
    theme: {
        field: "tematica",
        type: DataTypes.STRING(50),
        allowNull: false
    },
    difficulty: {
        field: "dificultad",
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1, max: 5 }
    },
    duration_min: {
        field: "duracion_min",
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        validate: { min: 15, max: 180 }
    },
    min_players: {
        field: "jugadores_min",
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1 }
    },
    max_players: {
        field: "jugadores_max",
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1 }
    },
    price_per_person: {
        field: "precio_persona",
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
        field: "descripcion",
        type: DataTypes.TEXT,
        allowNull: false
    },
    tagline: {
        field: "lema",
        type: DataTypes.STRING(150),
        allowNull: true
    },
    min_age: {
        field: "edad_minima",
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: { max: 99 }
    },
    //Pruebas de la sala, una por línea
    challenges: {
        field: "pruebas",
        type: DataTypes.TEXT,
        allowNull: true
    },
    image_url: {
        field: "url_imagen",
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_active: {
        field: "activa",
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
        tableName: "salas",
        validate: {
            jugadoresCoherentes() {
                if (this.max_players < this.min_players) throw new Error("max_players no puede ser menor que min_players");
            }
        },
        indexes: [{ fields: ["tematica"] }, { fields: ["activa"] }]
    })

module.exports = Sala;
