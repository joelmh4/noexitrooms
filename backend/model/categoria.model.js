const mongoose = require('mongoose');
const { idNumerico } = require('./contador.model');

// Tipos de ticket (Reservas, Bonos, Objetos perdidos...). No se borran: se desactivan,
// así los tickets antiguos siguen teniendo su categoría.
const categoriaSchema = new mongoose.Schema({
    _id: Number,
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 80
    },
    is_active: {
        type: Boolean,
        default: true
    }
},
    {
        versionKey: false
    })

categoriaSchema.plugin(idNumerico, { nombre: "categoria" });

const Categoria = mongoose.model('categoria', categoriaSchema);

module.exports = Categoria;
