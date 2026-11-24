const mongoose = require('mongoose');

// MongoDB da a cada documento un _id largo (ObjectId). Para que los tickets tengan un número
// corto (NXR-0004) y la web siga usando ids numéricos, cada colección lleva su contador aquí:
// { _id: "tickets", seq: 5 }
const appContadoresSchema = new mongoose.Schema({
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
const Contador = mongoose.model("contador", appContadoresSchema, "contadores");

// Suma 1 al contador y devuelve el número nuevo ($inc nunca da el mismo número a dos peticiones)
const siguienteId = async (nombre) => {
    const contador = await Contador.findByIdAndUpdate(nombre, { $inc: { seq: 1 } }, { returnDocument: "after", upsert: true });
    return contador.seq;
}

// Para los esquemas con _id numérico:
// - al guardar un documento nuevo sin _id, le pone el siguiente número
// - al enviarlo como JSON, _id sale como "id" (es lo que usa la web) y sin los campos de "ocultar"
const idNumerico = (schema, { nombre, ocultar = [] }) => {
    schema.pre("save", async function () {
        if (this.isNew && this._id == null) {
            this._id = await siguienteId(nombre);
        }
    });

    schema.set("toJSON", {
        transform: (doc, ret) => {
            const { _id, ...resto } = ret;
            for (const campo of ocultar) delete resto[campo];
            return { id: _id, ...resto };
        }
    });
}

module.exports = Contador;
module.exports.siguienteId = siguienteId;
module.exports.idNumerico = idNumerico;
