// Métricas del panel (enunciado: "vista de tickets pendientes y métricas básicas" y, como mejora,
// "estadísticas por agente"). El admin ve las de todo el equipo; el agente, las suyas.
import { consultar } from "../db/conexion";
import { ESTADOS, PRIORIDADES, type EstadoTicket, type Prioridad, type UsuarioPublico } from "../models/tipos";
import { ahoraEnMadrid } from "./reservas.service";

type Cuenta<K extends string> = Record<K, number>;

// Pasa filas { clave, n } a un objeto con todas las claves (las que no salen, a 0)
function contar<K extends string>(claves: readonly K[], filas: { clave: K; n: number }[]): Cuenta<K> {
  const resultado = Object.fromEntries(claves.map(k => [k, 0])) as Cuenta<K>;
  for (const f of filas) resultado[f.clave] = Number(f.n);
  return resultado;
}

const ACTIVO = "t.status NOT IN ('resuelto', 'cerrado')";

export async function resumen(yo: UsuarioPublico) {
  // El agente solo cuenta sus tickets; los libres se cuentan aparte
  const deQuien = yo.role === "agente" ? "t.agent_id = ?" : "TRUE";
  const v = yo.role === "agente" ? [yo.id] : [];

  const [porEstado, porPrioridad, porCategoria, [libres], [tiempos], ultimos] = await Promise.all([
    consultar<{ clave: EstadoTicket; n: number }>(`SELECT t.status AS clave, COUNT(*) AS n FROM tickets t WHERE ${deQuien} GROUP BY t.status`, v),
    // Prioridad de los que siguen abiertos: es lo que hay que atender
    consultar<{ clave: Prioridad; n: number }>(`SELECT t.priority AS clave, COUNT(*) AS n FROM tickets t WHERE ${deQuien} AND ${ACTIVO} GROUP BY t.priority`, v),
    consultar<{ id: number; name: string; n: number }>(
      `SELECT c.id, c.name, COUNT(t.id) AS n FROM ticket_categories c
         LEFT JOIN tickets t ON t.category_id = c.id AND ${deQuien}
        GROUP BY c.id, c.name ORDER BY n DESC, c.name`, v),
    consultar<{ n: number; alta: number }>(
      `SELECT COUNT(*) AS n, COALESCE(SUM(t.priority = 'alta'), 0) AS alta FROM tickets t WHERE t.agent_id IS NULL AND t.status <> 'cerrado'`),
    // Horas desde que se abre hasta que se marca resuelto por primera vez
    consultar<{ horas: number | null; resueltos: number }>(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, t.created_at, h.primera)) / 60 AS horas, COUNT(*) AS resueltos
         FROM tickets t
         JOIN (SELECT ticket_id, MIN(changed_at) AS primera FROM ticket_status_history WHERE new_status = 'resuelto' GROUP BY ticket_id) h
           ON h.ticket_id = t.id
        WHERE ${deQuien}`, v),
    consultar<{ dia: string; n: number }>(
      `SELECT DATE_FORMAT(t.created_at, '%Y-%m-%d') AS dia, COUNT(*) AS n FROM tickets t
        WHERE ${deQuien} AND t.created_at >= CURRENT_DATE - INTERVAL 6 DAY
        GROUP BY dia ORDER BY dia`, v)
  ]);

  const estados = contar(ESTADOS, porEstado);
  const base = {
    tickets: {
      total: Object.values(estados).reduce((a, b) => a + b, 0),
      activos: estados.abierto + estados.en_curso + estados.pendiente_cliente,
      por_estado: estados,
      activos_por_prioridad: contar(PRIORIDADES, porPrioridad),
      por_categoria: porCategoria.map(c => ({ ...c, n: Number(c.n) })),
      sin_asignar: { total: Number(libres.n), alta: Number(libres.alta) },
      horas_medias_hasta_resolver: tiempos.horas === null ? null : Math.round(Number(tiempos.horas) * 10) / 10,
      creados_ultimos_7_dias: ultimos.map(d => ({ dia: d.dia, n: Number(d.n) }))
    }
  };
  if (yo.role === "agente") return base;

  // Solo admin: carga y rendimiento de cada agente, y reservas
  const [agentes, [reservas]] = await Promise.all([
    consultar<{ id: number; name: string; activos: number; pendientes_cliente: number; resueltos: number }>(
      `SELECT u.id, u.name,
              COALESCE(SUM(t.status IN ('abierto', 'en_curso', 'pendiente_cliente')), 0) AS activos,
              COALESCE(SUM(t.status = 'pendiente_cliente'), 0) AS pendientes_cliente,
              COALESCE(SUM(t.status IN ('resuelto', 'cerrado')), 0) AS resueltos
         FROM users u LEFT JOIN tickets t ON t.agent_id = u.id
        WHERE u.role = 'agente' AND u.is_active = TRUE
        GROUP BY u.id, u.name ORDER BY activos DESC, u.name`),
    consultar<{ pendientes: number; proximas: number }>(
      `SELECT COALESCE(SUM(status = 'pendiente'), 0) AS pendientes,
              COALESCE(SUM(status <> 'cancelada' AND starts_at >= ? AND starts_at < ? + INTERVAL 7 DAY), 0) AS proximas
         FROM bookings`, [ahoraEnMadrid().replace("T", " ") + ":00", ahoraEnMadrid().slice(0, 10)])
  ]);
  return {
    ...base,
    agentes: agentes.map(a => ({ ...a, activos: Number(a.activos), pendientes_cliente: Number(a.pendientes_cliente), resueltos: Number(a.resueltos) })),
    reservas: { pendientes_de_confirmar: Number(reservas.pendientes), proximos_7_dias: Number(reservas.proximas) }
  };
}
