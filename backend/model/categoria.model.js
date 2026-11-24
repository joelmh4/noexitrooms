const mongoose = require('mongoose');
const { idNumerico } = require('./contador.model');

// Colección categorias: tipos de ticket. No se borran: se desactivan,
// así los tickets antiguos siguen teniendo su categoría.
const appCategoriasSchema = new mongoose.Schema({
    _id: Number,
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 80
    },
    is_active: {
        type: Boolean,
        default: true
    }
},
    {
        versionKey: false,
        //Sin mirar mayúsculas ni tildes: "objetos perdidos" choca con "Objetos perdidos"
        collation: { locale: "es", strength: 1 }
    })

appCategoriasSchema.plugin(idNumerico, { nombre: "categorias" });

const Categoria = mongoose.model("categoria", appCategoriasSchema);

module.exports = Categoria;
