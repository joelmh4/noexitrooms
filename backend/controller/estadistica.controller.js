// Métricas del panel (enunciado: "vista de tickets pendientes y métricas básicas" y, como mejora,
// "estadísticas por agente"). El admin ve las de todo el equipo; el agente, solo las suyas.
const { Op } = require("sequelize");
const { Ticket, Categoria, Usuario, Reserva, CambioEstado } = require("../model");
const { ESTADOS, PRIORIDADES } = require("../model/ticket.model");
const { aFecha } = require("../model/reserva.model");
const { ahoraEnMadrid, sumarDias } = require("../utils/horario");

const ACTIVOS = ["abierto", "en_curso", "pendiente_cliente"];

// Cuenta cuántos elementos de la lista tienen cada valor (los que no salen, a 0)
function contar(claves, lista) {
    const result = Object.fromEntries(claves.map(k => [k, 0]));
    for (const valor of lista) result[valor]++;
    return result;
}

class EstadisticaController {

    // GET /stats · agente o admin
    async resumen(req, res) {
        const yo = req.usuario;
        const deQuien = yo.role === "agente" ? { agent_id: yo.id } : {};

        const [tickets, categorias, resueltos] = await Promise.all([
            Ticket.findAll({ where: deQuien, attributes: ["id", "status", "priority", "category_id", "agent_id", "created_at"] }),
            Categoria.findAll({ order: [["name", "ASC"]] }),
            // Primera vez que cada ticket pasó a "resuelto"
            CambioEstado.findAll({ where: { new_status: "resuelto" }, order: [["changed_at", "ASC"]] })
        ]);
        const primeraResolucion = new Map();
        for (const h of resueltos) if (!primeraResolucion.has(h.ticket_id)) primeraResolucion.set(h.ticket_id, h.changed_at);
        const activos = tickets.filter(t => ACTIVOS.includes(t.status));

        // Horas desde que se abre hasta que se marca resuelto por primera vez
        const horas = tickets
            .map(t => {
                const resuelto = primeraResolucion.get(t.id);
                return resuelto ? (resuelto - t.created_at) / 3600000 : null;
            })
            .filter(h => h !== null);

        // Tickets creados cada día de la última semana (días con al menos uno)
        const hoy = new Date().toISOString().slice(0, 10);
        const desde = sumarDias(hoy, -6);
        const porDia = {};
        for (const t of tickets) {
            const dia = t.created_at.toISOString().slice(0, 10);
            if (dia >= desde) porDia[dia] = (porDia[dia] || 0) + 1;
        }

        const porEstado = contar(ESTADOS, tickets.map(t => t.status));
        const resumen = {
            total: tickets.length,
            activos: activos.length,
            por_estado: porEstado,
            activos_por_prioridad: contar(PRIORIDADES, activos.map(t => t.priority)),
            por_categoria: categorias
                .map(c => ({ id: c.id, name: c.name, n: tickets.filter(t => t.category_id === c.id).length }))
                .sort((a, b) => b.n - a.n),
            horas_medias_hasta_resolver: horas.length
                ? Math.round((horas.reduce((a, b) => a + b, 0) / horas.length) * 10) / 10
                : null,
            creados_ultimos_7_dias: Object.keys(porDia).sort().map(dia => ({ dia, n: porDia[dia] }))
        };

        // Los tickets sin asignar no son cosa del agente: los reparte el admin
        if (yo.role === "agente") return res.status(200).json({ tickets: resumen });

        // Solo admin: tickets sin asignar, carga de cada agente y reservas
        const ahora = ahoraEnMadrid();
        const [sinAsignar, agentes, pendientes, proximas] = await Promise.all([
            Ticket.findAll({ where: { agent_id: null, status: { [Op.ne]: "cerrado" } }, attributes: ["priority"] }),
            Usuario.findAll({ where: { role: "agente", is_active: true } }),
            Reserva.count({ where: { status: "pendiente" } }),
            Reserva.count({
                where: {
                    status: { [Op.ne]: "cancelada" },
                    starts_at: { [Op.gte]: aFecha(`${ahora}:00`), [Op.lt]: aFecha(`${sumarDias(ahora.slice(0, 10), 7)}T00:00:00`) }
                }
            })
        ]);

        resumen.sin_asignar = { total: sinAsignar.length, alta: sinAsignar.filter(t => t.priority === "alta").length };
        const cargaAgentes = agentes
            .map(a => {
                const suyos = tickets.filter(t => t.agent_id === a.id);
                return {
                    id: a.id,
                    name: a.name,
                    activos: suyos.filter(t => ACTIVOS.includes(t.status)).length,
                    pendientes_cliente: suyos.filter(t => t.status === "pendiente_cliente").length,
                    resueltos: suyos.filter(t => t.status === "resuelto" || t.status === "cerrado").length
                };
            })
            .sort((a, b) => b.activos - a.activos || a.name.localeCompare(b.name, "es"));

        return res.status(200).json({
            tickets: resumen,
            agentes: cargaAgentes,
            reservas: { pendientes_de_confirmar: pendientes, proximos_7_dias: proximas }
        });
    }
}

module.exports = new EstadisticaController();
