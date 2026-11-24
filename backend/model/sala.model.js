const mongoose = require('mongoose');
const { idNumerico } = require('./contador.model');

// Colección salas: las salas de escape, la entidad del CRUD temático
const appSalasSchema = new mongoose.Schema({
    _id: Number,
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
    },
    //Para la URL de la ficha: "El manicomio de San Tomás" → el-manicomio-de-san-tomas
    slug: {
        type: String,
        required: true,
        unique: true
    },
    theme: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    duration_min: {
        type: Number,
        required: true,
        min: 15,
        max: 180
    },
    min_players: {
        type: Number,
        required: true,
        min: 1
    },
    max_players: {
        type: Number,
        required: true,
        min: 1
    },
    price_per_person: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    tagline: {
        type: String,
        default: null
    },
    min_age: {
        type: Number,
        default: 0,
        min: 0,
        max: 99
    },
    //Pruebas de la sala, una por línea
    challenges: {
        type: String,
        default: null
    },
    image_url: {
        type: String,
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        versionKey: false,
        //Compara y ordena en español sin mirar mayúsculas ni tildes ("Álvaro" = "alvaro")
        collation: { locale: "es", strength: 1 }
    })

appSalasSchema.plugin(idNumerico, { nombre: "salas" });

const Sala = mongoose.model("sala", appSalasSchema);

module.exports = Sala;
