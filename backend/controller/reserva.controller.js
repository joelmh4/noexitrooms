// Reservas: el cliente reserva y ve las suyas; el equipo las consulta y las confirma o cancela.
// Una reserva nace "pendiente" hasta que la confirma el equipo.
const Reserva = require("../model/reserva.model");
const { ESTADOS_RESERVA } = require("../model/reserva.model");
const Sala = require("../model/sala.model");
const { ErrorApi } = require("../middleware/errores.middleware");
const { horasDe, ahoraEnMadrid } = require("../utils/horario");
const v = require("../utils/validacion");

// Rellena la sala y el cliente de cada reserva (populate = el "join" de Mongoose)
const conDatos = consulta => consulta
    .populate("room_id", "name slug image_url")
    .populate("customer_id", "name");

// Lo que se envía al frontend: los ids y, aparte, los datos de la sala y del cliente
function formatear(r) {
    const sala = r.room_id, cliente = r.customer_id;
    return {
        id: r._id,
        customer_id: cliente?._id ?? null,
        room_id: sala?._id ?? null,
        starts_at: r.starts_at,
        players: r.players,
        status: r.status,
        created_at: r.created_at,
        sala: sala ? { id: sala._id, name: sala.name, slug: sala.slug, image_url: sala.image_url } : null,
        cliente: cliente ? { id: cliente._id, name: cliente.name } : null
    };
}

async function buscarReserva(id) {
    const r = await conDatos(Reserva.findById(id));
    if (!r) throw ErrorApi.noEncontrado("Esa reserva no existe.");
    return formatear(r);
}

class ReservaController {

    // POST /bookings { room_id, starts_at: "AAAA-MM-DDTHH:MM", players } · cliente
    async create(req, res) {
        const b = req.body ?? {};
        const errores = {};
        const room_id = Number(b.room_id);
        if (!Number.isInteger(room_id) || room_id <= 0) errores.room_id = "Elige una sala.";
        const starts = typeof b.starts_at === "string" ? b.starts_at : "";
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:00)?$/.test(starts)) errores.starts_at = "Elige un día y una hora.";
        const players = Number(b.players);
        if (!Number.isInteger(players) || players < 1) errores.players = "¿Cuántas personas vais a jugar?";
        v.comprobar(errores);

        const sala = await Sala.findOne({ _id: room_id, is_active: true });
        if (!sala) throw ErrorApi.datosInvalidos({ room_id: "Esa sala no existe." });

        const [fecha, hora] = [starts.slice(0, 10), starts.slice(11, 16)];
        if (!horasDe(sala).includes(hora)) errores.starts_at = `Esa hora no es un pase de esta sala (${horasDe(sala).join(", ")}).`;
        else if (`${fecha}T${hora}` <= ahoraEnMadrid()) errores.starts_at = "Esa hora ya ha pasado.";
        if (players < sala.min_players || players > sala.max_players) {
            errores.players = `En esta sala jugáis de ${sala.min_players} a ${sala.max_players} personas.`;
        }
        v.comprobar(errores);

        const starts_at = `${fecha}T${hora}:00`;
        const datos = { customer_id: req.usuario.id, players, status: "pendiente" };
        let id;
        try {
            // El índice único (room_id, starts_at) impide dos reservas a la vez en el mismo hueco
            const nueva = await Reserva.create({ ...datos, room_id, starts_at });
            id = nueva._id;
        } catch (err) {
            if (err.code !== 11000) throw err;
            // Ese hueco ya tuvo una reserva: si estaba cancelada se reutiliza; si no, está ocupado
            const reutilizada = await Reserva.findOneAndUpdate(
                { room_id, starts_at, status: "cancelada" },
                { ...datos, created_at: new Date() },
                { returnDocument: "after", timestamps: false });
            if (!reutilizada) throw ErrorApi.conflicto("Alguien acaba de reservar esa hora. Elige otra.");
            id = reutilizada._id;
        }
        return res.status(201).json(await buscarReserva(id));
    }

    // GET /bookings/me · cliente
    async findMine(req, res) {
        const result = await conDatos(Reserva.find({ customer_id: req.usuario.id }).sort({ starts_at: -1 }));
        return res.status(200).json(result.map(formatear));
    }

    // GET /bookings?status=&room_id=&from=AAAA-MM-DD · agente o admin
    async findAll(req, res) {
        const errores = {};
        const q = req.query;
        const filtro = {};
        if (q.status) filtro.status = v.unoDe(errores, "status", q.status, ESTADOS_RESERVA);
        if (q.room_id) {
            filtro.room_id = Number(q.room_id);
            if (!Number.isInteger(filtro.room_id) || filtro.room_id <= 0) errores.room_id = "Tiene que ser un número de id.";
        }
        if (typeof q.from === "string") {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(q.from)) errores.from = "Usa el formato AAAA-MM-DD.";
            filtro.starts_at = { $gte: `${q.from}T00:00:00` };
        }
        v.comprobar(errores);

        const result = await conDatos(Reserva.find(filtro).sort({ starts_at: 1 }));
        return res.status(200).json(result.map(formatear));
    }

    // PATCH /bookings/:id/status { status }
    // Equipo (agente o admin): confirmar o cancelar. Cliente: solo cancelar una suya que aún no ha empezado.
    async updateStatus(req, res) {
        const id = v.idDeRuta(req.params.id);
        const errores = {};
        const status = v.unoDe(errores, "status", req.body?.status, ESTADOS_RESERVA);
        v.comprobar(errores);

        const reserva = await buscarReserva(id);
        const yo = req.usuario;
        if (yo.role === "cliente") {
            if (reserva.customer_id !== yo.id) throw ErrorApi.noEncontrado("Esa reserva no existe.");
            if (status !== "cancelada") throw ErrorApi.prohibido("Solo puedes cancelar tu reserva; la confirma el equipo.");
            if (reserva.starts_at.slice(0, 16) <= ahoraEnMadrid()) throw ErrorApi.conflicto("Esa partida ya ha empezado o ha pasado.");
        }
        if (reserva.status === "cancelada" && status !== "cancelada") {
            throw ErrorApi.conflicto("Una reserva cancelada no se puede recuperar: hay que hacer una nueva.");
        }
        await Reserva.updateOne({ _id: id }, { status });
        return res.status(200).json(await buscarReserva(id));
    }
}

module.exports = new ReservaController();
