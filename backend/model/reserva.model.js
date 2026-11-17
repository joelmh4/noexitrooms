const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ESTADOS_RESERVA = ["pendiente", "confirmada", "cancelada"];

// "2026-11-20T18:00:00" (hora de Madrid) → Date para guardarla tal cual en la columna DATETIME
const aFecha = texto => new Date(`${texto.slice(0, 19)}Z`);

// Tabla bookings: reservas (mejora opcional del enunciado).
// La hora es "de reloj" en Madrid: en la API va como texto AAAA-MM-DDTHH:MM:SS, sin zona.
const Reserva = sequelize.define('reserva', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    //customer_id y room_id son claves foráneas: se crean en model/index.js con las relaciones
    starts_at: {
        type: DataTypes.DATE,
        allowNull: false,
        get() {
            const valor = this.getDataValue("starts_at");
            return valor ? valor.toISOString().slice(0, 19) : valor;
        },
        set(valor) {
            this.setDataValue("starts_at", typeof valor === "string" ? aFecha(valor) : valor);
        }
    },
    players: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        validate: { min: 1 }
    },
    status: {
        type: DataTypes.ENUM(...ESTADOS_RESERVA),
        allowNull: false,
        defaultValue: "pendiente"
    }
},
    {
        tableName: "bookings",
        updatedAt: false,
        //Una sala no puede tener dos reservas a la misma hora
        indexes: [{ name: "uq_bookings_slot", unique: true, fields: ["room_id", "starts_at"] }]
    })

module.exports = Reserva;
module.exports.ESTADOS_RESERVA = ESTADOS_RESERVA;
module.exports.aFecha = aFecha;
