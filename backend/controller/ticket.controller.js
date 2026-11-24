// Tickets de soporte: quién ve qué, quién puede hacer cada cambio y el historial de estados.
//
// Reglas (enunciado, apartado 03 y matriz de autorización):
// - Cliente: ve y responde solo sus tickets. Puede cerrar uno "resuelto" o pedir que se reabra.
// - Agente: solo ve, responde y cambia estado o prioridad en los que tiene asignados. No puede cerrar.
// - Admin: ve todos, asigna o reasigna, y puede hacer cualquier cambio de estado.
// Si un ticket no se puede ver, se responde 404 (no 403): así nadie averigua si existe.
const Ticket = require("../model/ticket.model");
const { ESTADOS, PRIORIDADES, codigoTicket } = require("../model/ticket.model");
const Usuario = require("../model/usuario.model");
const Categoria = require("../model/categoria.model");
const Sala = require("../model/sala.model");
const Reserva = require("../model/reserva.model");
const Mensaje = require("../model/mensaje.model");
const CambioEstado = require("../model/cambioEstado.model");
const { ErrorApi } = require("../middleware/errores.middleware");
const v = require("../utils/validacion");

const ORDENES = ["recientes", "antiguos", "prioridad"];
const PESO_PRIORIDAD = { alta: 0, media: 1, baja: 2 };

// Filtro de "lo que este usuario puede ver"
function visibilidad(yo) {
    if (yo.role === "cliente") return { customer_id: yo.id };
    if (yo.role === "agente") return { agent_id: yo.id };
    return {};
}

// populate (el JOIN de Mongoose): con cada ticket vienen su cliente, su agente, su categoría y su sala
const conDatos = consulta => consulta
    .populate("customer_id", "name role")
    .populate("agent_id", "name role")
    .populate("category_id", "name")
    .populate("room_id", "name slug");

const persona = u => (u ? { id: u._id, name: u.name, role: u.role } : null);

// Lo que se envía al frontend: los ids y, aparte, los datos de cada uno
function formatear(t) {
    return {
        id: t._id,
        codigo: codigoTicket(t._id),
        customer_id: t.customer_id ? t.customer_id._id : null,
        agent_id: t.agent_id ? t.agent_id._id : null,
        category_id: t.category_id ? t.category_id._id : null,
        room_id: t.room_id ? t.room_id._id : null,
        booking_id: t.booking_id,
        subject: t.subject,
        description: t.description,
        priority: t.priority,
        status: t.status,
        created_at: t.created_at,
        updated_at: t.updated_at,
        closed_at: t.closed_at,
        cliente: persona(t.customer_id),
        agente: persona(t.agent_id),
        categoria: t.category_id ? t.category_id.name : null,
        sala: t.room_id ? { id: t.room_id._id, name: t.room_id.name, slug: t.room_id.slug } : null
    };
}

// Ticket con sus mensajes y su historial. El cliente nunca recibe las notas internas del equipo.
async function detalleDe(yo, id) {
    const t = await conDatos(Ticket.findOne({ _id: id, ...visibilidad(yo) }));
    if (!t) throw ErrorApi.noEncontrado("Ese ticket no existe o no tienes acceso.");
    const soloPublicos = yo.role === "cliente" ? { is_internal: false } : {};
    const [mensajes, historial] = await Promise.all([
        Mensaje.find({ ticket_id: id, ...soloPublicos }).populate("author_id", "name role").sort({ created_at: 1, _id: 1 }),
        CambioEstado.find({ ticket_id: id }).populate("changed_by_id", "name role").sort({ changed_at: 1, _id: 1 })
    ]);
    return {
        ...formatear(t),
        mensajes: mensajes.map(m => ({
            id: m._id, ticket_id: m.ticket_id, author_id: m.author_id ? m.author_id._id : null, body: m.body,
            is_internal: m.is_internal, created_at: m.created_at, autor: persona(m.author_id)
        })),
        historial: historial.map(h => ({
            id: h._id, ticket_id: h.ticket_id, changed_by_id: h.changed_by_id ? h.changed_by_id._id : null, old_status: h.old_status,
            new_status: h.new_status, changed_at: h.changed_at, autor: persona(h.changed_by_id)
        }))
    };
}

// Devuelve el ticket (sin rellenar) si este usuario puede verlo; si no, 404
async function visible(yo, id) {
    const t = await Ticket.findOne({ _id: id, ...visibilidad(yo) });
    if (!t) throw ErrorApi.noEncontrado("Ese ticket no existe o no tienes acceso.");
    return t;
}

// Segunda comprobación: el agente solo trabaja en los tickets que tiene asignados
function exigirQueLoLleve(yo, t) {
    if (yo.role === "agente" && t.agent_id !== yo.id) throw ErrorApi.prohibido("Este ticket no está asignado a ti.");
}

// ¿Puede este rol pasar el ticket de un estado a otro? Devuelve el motivo si no puede
function transicionPermitida(rol, desde, hasta) {
    if (rol === "admin") return null;
    if (rol === "cliente") {
        if (desde === "resuelto" && (hasta === "cerrado" || hasta === "abierto")) return null;
        return "Solo puedes confirmar el cierre de un ticket resuelto o pedir que se reabra.";
    }
    // agente
    if (desde === "cerrado") return "El ticket está cerrado. Solo el administrador puede reabrirlo.";
    if (hasta === "cerrado") return "El cierre lo confirma el cliente o el administrador.";
    return null;
}

// Cambia el estado y lo apunta en el historial
async function registrarEstado(t, nuevo, quien) {
    const anterior = t.status;
    t.status = nuevo;
    t.closed_at = nuevo === "cerrado" ? new Date() : null;
    await t.save();
    await CambioEstado.create({ ticket_id: t._id, changed_by_id: quien, old_status: anterior, new_status: nuevo });
}

class TicketController {

    // GET /tickets?status=&priority=&category_id=&customer_id=&agent_id=(id|ninguno)&q=&orden=
    async findAll(req, res) {
        const errores = {};
        const q = req.query;
        const filtro = { ...visibilidad(req.usuario) };
        const extra = {};
        if (q.status) extra.status = v.unoDe(errores, "status", q.status, ESTADOS);
        if (q.priority) extra.priority = v.unoDe(errores, "priority", q.priority, PRIORIDADES);
        const categoria = v.idOpcional(errores, "category_id", q.category_id);
        if (categoria) extra.category_id = categoria;
        const cliente = v.idOpcional(errores, "customer_id", q.customer_id);
        if (cliente) extra.customer_id = cliente;
        if (q.agent_id === "ninguno") extra.agent_id = null;
        else {
            const agente = v.idOpcional(errores, "agent_id", q.agent_id);
            if (agente) extra.agent_id = agente;
        }
        const orden = q.orden ? v.unoDe(errores, "orden", q.orden, ORDENES) : "recientes";
        v.comprobar(errores);

        // $and: los filtros nunca amplían lo que el usuario puede ver
        const condiciones = [filtro, extra];
        if (typeof q.q === "string" && q.q.trim()) {
            // Busca en asunto y descripción; "NXR-0004" o "4" también encuentran el ticket por su número
            const texto = q.q.trim().slice(0, 100);
            const numero = Number(texto.replace(/^NXR-?/i, ""));
            const o = [{ subject: v.buscarTexto(texto) }, { description: v.buscarTexto(texto) }];
            if (Number.isInteger(numero) && numero > 0) o.push({ _id: numero });
            condiciones.push({ $or: o });
        }

        const sort = orden === "antiguos" ? { created_at: 1, _id: 1 } : { updated_at: -1, _id: -1 };
        let result = (await conDatos(Ticket.find({ $and: condiciones }).sort(sort))).map(formatear);
        if (orden === "prioridad") {
            // Array.sort es estable: dentro de la misma prioridad se queda el orden por fecha
            result = result.sort((a, b) => PESO_PRIORIDAD[a.priority] - PESO_PRIORIDAD[b.priority]);
        }
        return res.status(200).json(result);
    }

    // GET /tickets/:id
    async findById(req, res) {
        return res.status(200).json(await detalleDe(req.usuario, v.idDeRuta(req.params.id)));
    }

    // POST /tickets { subject, description, category_id, priority?, room_id?, booking_id?, customer_id? (admin) }
    async create(req, res) {
        const yo = req.usuario;
        const b = req.body ?? {};
        const errores = {};
        const datos = {
            subject: v.texto(errores, "subject", b.subject, { min: 5, max: 150, nombre: "El asunto" }),
            description: v.texto(errores, "description", b.description, { min: 20, max: 2000, nombre: "La descripción" }),
            category_id: v.idOpcional(errores, "category_id", b.category_id),
            priority: b.priority === undefined ? "media" : v.unoDe(errores, "priority", b.priority, PRIORIDADES),
            room_id: v.idOpcional(errores, "room_id", b.room_id) ?? null,
            booking_id: v.idOpcional(errores, "booking_id", b.booking_id) ?? null
        };
        const pedidoPara = v.idOpcional(errores, "customer_id", b.customer_id);
        if (!datos.category_id && !errores.category_id) errores.category_id = "Elige una categoría.";
        v.comprobar(errores);

        // Solo el admin puede abrirlo en nombre de un cliente
        const clienteId = yo.role === "admin" && pedidoPara ? pedidoPara : yo.id;
        if (clienteId !== yo.id && !(await Usuario.exists({ _id: clienteId, role: "cliente", is_active: true }))) {
            errores.customer_id = "Ese cliente no existe.";
        }
        if (!(await Categoria.exists({ _id: datos.category_id, is_active: true }))) errores.category_id = "Esa categoría no existe.";
        if (datos.booking_id) {
            // La reserva tiene que ser del mismo cliente; si no se indicó sala, se toma la de la reserva
            const reserva = await Reserva.findOne({ _id: datos.booking_id, customer_id: clienteId });
            if (!reserva) errores.booking_id = "Esa reserva no existe o no es tuya.";
            else if (datos.room_id && datos.room_id !== reserva.room_id) errores.room_id = "La sala no coincide con la de la reserva.";
            else datos.room_id = reserva.room_id;
        }
        if (datos.room_id && !errores.room_id && !(await Sala.exists({ _id: datos.room_id }))) errores.room_id = "Esa sala no existe.";
        v.comprobar(errores);

        // El ticket, su primer mensaje y el primer estado del historial
        const ticket = await Ticket.create({ ...datos, customer_id: clienteId });
        await Mensaje.create({ ticket_id: ticket._id, author_id: yo.id, body: datos.description });
        await CambioEstado.create({ ticket_id: ticket._id, changed_by_id: yo.id, old_status: null, new_status: "abierto" });
        return res.status(201).json(await detalleDe(yo, ticket._id));
    }

    // POST /tickets/:id/messages { body, is_internal? }
    async addMessage(req, res) {
        const yo = req.usuario;
        const id = v.idDeRuta(req.params.id);
        const errores = {};
        const body = v.texto(errores, "body", req.body?.body, { min: 1, max: 5000, nombre: "el mensaje" });
        const interno = req.body?.is_internal ?? false;
        if (typeof interno !== "boolean") errores.is_internal = "Tiene que ser true o false.";
        v.comprobar(errores);
        if (interno && yo.role === "cliente") throw ErrorApi.prohibido("Los clientes no pueden escribir notas internas.");

        const t = await visible(yo, id);
        exigirQueLoLleve(yo, t);
        if (t.status === "cerrado") throw ErrorApi.conflicto("El ticket está cerrado. Pide que se reabra para seguir escribiendo.");

        await Mensaje.create({ ticket_id: id, author_id: yo.id, body, is_internal: interno });
        // Si el cliente contesta lo que le pidió el equipo, el ticket vuelve a "En curso"
        if (yo.role === "cliente" && t.status === "pendiente_cliente") await registrarEstado(t, "en_curso", yo.id);
        // Si no, solo se actualiza updated_at: la última actividad del ticket es este mensaje
        else await Ticket.updateOne({ _id: id }, { updated_at: new Date() });
        return res.status(201).json(await detalleDe(yo, id));
    }

    // PATCH /tickets/:id/status { status }
    async updateStatus(req, res) {
        const yo = req.usuario;
        const id = v.idDeRuta(req.params.id);
        const errores = {};
        const nuevo = v.unoDe(errores, "status", req.body?.status, ESTADOS);
        v.comprobar(errores);

        const t = await visible(yo, id);
        exigirQueLoLleve(yo, t);
        // Si ya está en ese estado no se cambia nada (no se ensucia el historial)
        if (t.status !== nuevo) {
            const motivo = transicionPermitida(yo.role, t.status, nuevo);
            if (motivo) throw ErrorApi.prohibido(motivo);
            await registrarEstado(t, nuevo, yo.id);
        }
        return res.status(200).json(await detalleDe(yo, id));
    }

    // PATCH /tickets/:id { priority?, category_id? } · agente que lo lleva o admin
    async updateById(req, res) {
        const yo = req.usuario;
        const id = v.idDeRuta(req.params.id);
        const errores = {};
        const cambios = {};
        if (req.body?.priority !== undefined) cambios.priority = v.unoDe(errores, "priority", req.body.priority, PRIORIDADES);
        if (req.body?.category_id !== undefined) cambios.category_id = v.idOpcional(errores, "category_id", req.body.category_id);
        if (!Object.keys(cambios).length && !Object.keys(errores).length) errores.cambios = "Envía priority o category_id.";
        v.comprobar(errores);

        const t = await visible(yo, id);
        exigirQueLoLleve(yo, t);
        if (cambios.category_id !== undefined && !(await Categoria.exists({ _id: cambios.category_id, is_active: true }))) {
            throw ErrorApi.datosInvalidos({ category_id: "Esa categoría no existe." });
        }
        t.set(cambios);
        await t.save();
        return res.status(200).json(await detalleDe(yo, id));
    }

    // PATCH /tickets/:id/assign { agent_id: número | null } · solo admin (lo comprueba la ruta)
    async assign(req, res) {
        const yo = req.usuario;
        const id = v.idDeRuta(req.params.id);
        const errores = {};
        if (req.body?.agent_id === undefined) errores.agent_id = "Indica el agente (o null para dejarlo sin asignar).";
        const agenteId = req.body?.agent_id === null ? null : v.idOpcional(errores, "agent_id", req.body?.agent_id) ?? null;
        v.comprobar(errores);

        const t = await visible(yo, id);
        if (agenteId !== null && !(await Usuario.exists({ _id: agenteId, role: "agente", is_active: true }))) {
            throw ErrorApi.datosInvalidos({ agent_id: "Ese agente no existe o está desactivado." });
        }
        t.agent_id = agenteId;
        await t.save();
        return res.status(200).json(await detalleDe(yo, id));
    }
}

module.exports = new TicketController();
