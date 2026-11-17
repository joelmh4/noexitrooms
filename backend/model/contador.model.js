const mongoose = require('mongoose');

// MongoDB da a cada documento un _id largo (ObjectId). Para que los tickets tengan un número
// corto (NXR-0004) y el frontend siga usando ids numéricos, cada colección lleva su propio
// contador en esta colección: { _id: "ticket", seq: 4 }.
const contadorSchema = new mongoose.Schema({
    _id: String,
    seq: {
        type: Number,
        default: 0
    }
},
    {
        versionKey: false
    })

//El tercer parámetro es el nombre de la colección (si no, Mongoose la llamaría "contadors")
const Contador = mongoose.model('contador', contadorSchema, 'contadores');

// Suma 1 al contador y devuelve el número nuevo. $inc es atómico: dos peticiones a la vez nunca reciben el mismo
const siguienteId = async (nombre) => {
    const contador = await Contador.findByIdAndUpdate(nombre, { $inc: { seq: 1 } }, { returnDocument: "after", upsert: true });
    return contador.seq;
}

// Plugin para los esquemas con _id numérico:
// - al guardar un documento nuevo sin _id, le da el siguiente número
// - al enviarlo como JSON, _id sale como "id" (es lo que espera el frontend)
//   y los campos de "ocultar" no salen nunca (la contraseña del usuario)
const idNumerico = (schema, { nombre, ocultar = [] }) => {
    schema.pre('save', async function () {
        if (this.isNew && this._id == null) {
            this._id = await siguienteId(nombre);
        }
    });

    schema.set('toJSON', {
        transform: (doc, ret) => {
            const { _id, ...resto } = ret;
            for (const campo of ocultar) delete resto[campo];
            return { id: _id, ...resto };
        }
    });
}

module.exports = { Contador, siguienteId, idNumerico };
