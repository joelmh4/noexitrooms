// Salas: catálogo público con buscador y CRUD del administrador
const Sala = require("../model/sala.model");
const Ticket = require("../model/ticket.model");
const Reserva = require("../model/reserva.model");
const { ErrorApi } = require("../middleware/errores.middleware");
const { horasDe, ahoraEnMadrid, sumarDias } = require("../utils/horario");
const v = require("../utils/validacion");

const ORDENES = {
    nombre: { name: 1 },
    dificultad: { difficulty: 1, name: 1 },
    precio: { price_per_person: 1, name: 1 },
    duracion: { duration_min: 1, name: 1 }
};

// "El manicomio de San Tomás" → "el-manicomio-de-san-tomas" (igual que en el frontend)
const slugDe = texto =>
    texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Por slug (la web pública) o por id (el panel). Si no existe → 404
async function buscarSala(clave, { soloActivas = true } = {}) {
    const filtro = typeof clave === "number" ? { _id: clave } : { slug: clave };
    if (soloActivas) filtro.is_active = true;
    const sala = await Sala.findOne(filtro);
    if (!sala) throw ErrorApi.noEncontrado("Esa sala no existe.");
    return sala;
}

// Lee y valida el cuerpo de crear/editar una sala
function leerSala(b = {}) {
    const errores = {};
    const datos = {
        name: v.texto(errores, "name", b.name, { min: 3, max: 100, nombre: "El nombre" }),
        theme: v.texto(errores, "theme", b.theme, { min: 3, max: 50, nombre: "La temática" }),
        difficulty: v.entero(errores, "difficulty", b.difficulty, 1, 5, "Entre 1 y 5."),
        duration_min: v.entero(errores, "duration_min", b.duration_min, 15, 180, "Entre 15 y 180 minutos."),
        min_players: v.entero(errores, "min_players", b.min_players, 1, 20, "Entre 1 y 20."),
        max_players: v.entero(errores, "max_players", b.max_players, 1, 20, "Entre 1 y 20."),
        price_per_person: Number(b.price_per_person),
        description: v.texto(errores, "description", b.description, { min: 20, max: 5000, nombre: "La descripción" }),
        tagline: typeof b.tagline === "string" && b.tagline.trim() ? v.texto(errores, "tagline", b.tagline, { max: 150, nombre: "La frase" }) : null,
        min_age: b.min_age === undefined || b.min_age === null ? 0 : v.entero(errores, "min_age", b.min_age, 0, 99, "Entre 0 y 99."),
        challenges: typeof b.challenges === "string" && b.challenges.trim() ? v.texto(errores, "challenges", b.challenges, { max: 2000, nombre: "Las pruebas" }) : null,
        image_url: typeof b.image_url === "string" && b.image_url.trim() ? v.texto(errores, "image_url", b.image_url, { max: 255, nombre: "La ruta de la imagen" }) : null,
        is_active: b.is_active === undefined ? true : b.is_active
    };
    if (b.price_per_person === "" || b.price_per_person === null || !Number.isFinite(datos.price_per_person) ||
        datos.price_per_person < 0 || datos.price_per_person > 9999) errores.price_per_person = "Escribe un precio entre 0 y 9999.";
    if (!errores.min_players && !errores.max_players && datos.max_players < datos.min_players) {
        errores.max_players = "No puede ser menor que el mínimo.";
    }
    if (typeof datos.is_active !== "boolean") errores.is_active = "Tiene que ser true o false.";
    v.comprobar(errores);
    datos.price_per_person = Math.round(datos.price_per_person * 100) / 100;
    datos.slug = slugDe(datos.name);
    return datos;
}

const nombreOcupado = (datos, excepto = 0) =>
    Sala.findOne({ $or: [{ slug: datos.slug }, { name: datos.name }], _id: { $ne: excepto } });

class SalaController {

    // GET /rooms?q=&theme=&difficulty=&players=&orden= · ?all=1 también las desactivadas (admin)
    async findAll(req, res) {
        const todas = v.pideTodas(req.query.all);
        if (todas && req.usuario?.role !== "admin") throw ErrorApi.prohibido();
        const errores = {};
        const q = req.query;
        const filtro = {};
        if (!todas) filtro.is_active = true;
        if (typeof q.q === "string" && q.q.trim()) {
            //$or: busca el texto en el nombre, la frase o la descripción
            const texto = v.buscarTexto(q.q.trim().slice(0, 100));
            filtro.$or = [{ name: texto }, { tagline: texto }, { description: texto }];
        }
        if (typeof q.theme === "string" && q.theme.trim()) filtro.theme = q.theme.trim();
        if (q.difficulty) filtro.difficulty = v.entero(errores, "difficulty", q.difficulty, 1, 5, "Entre 1 y 5.");
        if (q.players) {
            const jugadores = v.entero(errores, "players", q.players, 1, 99, "Número de jugadores no válido.");
            //$lte: menor o igual que · $gte: mayor o igual que
            filtro.min_players = { $lte: jugadores };
            filtro.max_players = { $gte: jugadores };
        }
        const orden = q.orden ? v.unoDe(errores, "orden", q.orden, Object.keys(ORDENES)) : "nombre";
        v.comprobar(errores);

        const result = await Sala.find(filtro).sort(ORDENES[orden]);
        return res.status(200).json(result);
    }

    // GET /rooms/:slug (web pública) · también acepta el id numérico
    async findBySlug(req, res) {
        const clave = String(req.params.slug);
        const result = await buscarSala(/^\d+$/.test(clave) ? Number(clave) : clave);
        return res.status(200).json(result);
    }

    // POST /rooms · solo admin
    async create(req, res) {
        const datos = leerSala(req.body);
        if (await nombreOcupado(datos)) throw ErrorApi.conflicto("Ya hay una sala con ese nombre.");
        if (!datos.image_url) datos.image_url = `img/salas/${datos.slug}/principal.webp`;
        const result = await Sala.create(datos);
        return res.status(201).json(result);
    }

    // PUT /rooms/:id · solo admin
    async updateById(req, res) {
        const id = v.idDeRuta(req.params.id);
        const actual = await buscarSala(id, { soloActivas: false });
        const datos = leerSala(req.body);
        if (await nombreOcupado(datos, id)) throw ErrorApi.conflicto("Ya hay una sala con ese nombre.");
        if (!datos.image_url) datos.image_url = actual.image_url;
        actual.set(datos);
        await actual.save();
        return res.status(200).json(actual);
    }

    // DELETE /rooms/:id · solo admin. Con tickets o reservas no se borra: se desactiva (no se pierde el historial)
    async deleteById(req, res) {
        const id = v.idDeRuta(req.params.id);
        const sala = await buscarSala(id, { soloActivas: false });
        const [tickets, reservas] = await Promise.all([
            Ticket.countDocuments({ room_id: id }),
            Reserva.countDocuments({ room_id: id })
        ]);
        if (tickets || reservas) {
            throw ErrorApi.conflicto("La sala tiene tickets o reservas asociados. Desactívala en lugar de borrarla.");
        }
        await Sala.findByIdAndDelete(id);
        return res.status(204).end();
    }

    // GET /rooms/:id/slots?from=AAAA-MM-DD&days=7 · no dice quién ha reservado, solo si está libre (o si es tuya)
    async findSlots(req, res) {
        const id = v.idDeRuta(req.params.id);
        const errores = {};
        const desde = typeof req.query.from === "string" ? req.query.from : ahoraEnMadrid().slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || Number.isNaN(Date.parse(`${desde}T00:00:00Z`))) errores.from = "Usa el formato AAAA-MM-DD.";
        const dias = req.query.days === undefined ? 7 : v.entero(errores, "days", req.query.days, 1, 31, "Entre 1 y 31 días.");
        v.comprobar(errores);

        const sala = await buscarSala(id);
        //starts_at es texto AAAA-MM-DDTHH:MM:SS: comparar textos sirve para buscar entre dos fechas
        const ocupadas = await Reserva.find({
            room_id: id,
            status: { $ne: "cancelada" },
            starts_at: { $gte: `${desde}T00:00:00`, $lt: `${sumarDias(desde, dias)}T00:00:00` }
        });
        const porHora = new Map(ocupadas.map(o => [o.starts_at, o.customer_id]));
        const ahora = ahoraEnMadrid();

        const result = [];
        for (let i = 0; i < dias; i++) {
            const fecha = sumarDias(desde, i);
            result.push({
                fecha,
                horas: horasDe(sala).map(hora => {
                    const starts_at = `${fecha}T${hora}:00`;
                    const de = porHora.get(starts_at);
                    const estado = starts_at.slice(0, 16) <= ahora ? "pasada"
                        : de === undefined ? "libre"
                        : de === req.usuario?.id ? "tuya" : "ocupada";
                    return { hora, starts_at, estado };
                })
            });
        }
        return res.status(200).json(result);
    }
}

module.exports = new SalaController();
module.exports.buscarSala = buscarSala;
