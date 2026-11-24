// Categorías de los tickets. GET es público (lo usa el formulario de nuevo ticket); crear y editar, solo admin.
const Categoria = require("../model/categoria.model");
const { ErrorApi } = require("../middleware/errores.middleware");
const v = require("../utils/validacion");

// El modelo compara sin mirar mayúsculas ni tildes (collation): "objetos perdidos" choca con "Objetos perdidos"
const nombreOcupado = (name, excepto = 0) =>
    Categoria.findOne({ name, _id: { $ne: excepto } });

class CategoriaController {

    // GET /categories · ?all=1 también las desactivadas (solo admin)
    async findAll(req, res) {
        const todas = v.pideTodas(req.query.all);
        if (todas && req.usuario?.role !== "admin") throw ErrorApi.prohibido();
        const filtro = todas ? {} : { is_active: true };
        const result = await Categoria.find(filtro).sort({ name: 1 });
        return res.status(200).json(result);
    }

    // POST /categories { name }
    async create(req, res) {
        const errores = {};
        const name = v.texto(errores, "name", req.body?.name, { min: 3, max: 80, nombre: "El nombre" });
        v.comprobar(errores);
        if (await nombreOcupado(name)) throw ErrorApi.conflicto("Esa categoría ya existe.");

        const categoria = await Categoria.create({ name });
        return res.status(201).json(categoria);
    }

    // PUT /categories/:id { name?, is_active? }
    async updateById(req, res) {
        const id = v.idDeRuta(req.params.id);
        const errores = {};
        const cambios = {};
        if (req.body?.name !== undefined) cambios.name = v.texto(errores, "name", req.body.name, { min: 3, max: 80, nombre: "El nombre" });
        if (req.body?.is_active !== undefined) {
            if (typeof req.body.is_active !== "boolean") errores.is_active = "Tiene que ser true o false.";
            else cambios.is_active = req.body.is_active;
        }
        if (!Object.keys(cambios).length && !Object.keys(errores).length) errores.cambios = "Envía name o is_active.";
        v.comprobar(errores);

        const categoria = await Categoria.findById(id);
        if (!categoria) throw ErrorApi.noEncontrado("Esa categoría no existe.");
        if (cambios.name !== undefined && (await nombreOcupado(cambios.name, id))) throw ErrorApi.conflicto("Esa categoría ya existe.");

        categoria.set(cambios);
        await categoria.save();
        return res.status(200).json(categoria);
    }
}

module.exports = new CategoriaController();
