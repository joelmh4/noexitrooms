// Tickets de soporte: quién ve qué, quién puede hacer cada cambio y el historial de estados.
//
// Reglas (enunciado, apartado 03 y matriz de autorización):
// - Cliente: ve y responde solo sus tickets. Puede cerrar uno "resuelto" o pedir que se reabra.
// - Agente: ve los que tiene asignados y los que están sin asignar (para poder quedárselos).
//   Solo puede responder, cambiar estado o prioridad en los suyos. No puede cerrar.
// - Admin: ve todos, asigna o reasigna, y puede hacer cualquier cambio de estado.
// Si un ticket no se puede ver, se responde 404 (no 403): así nadie averigua si existe.
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { consultar, enTransaccion } from "../db/conexion";
import { ErrorApi } from "../middleware/errores";
import {
  codigoTicket,
  type CambioEstado,
  type EstadoTicket,
  type MensajeTicket,
  type Prioridad,
  type Rol,
  type Ticket,
  type UsuarioPublico
} from "../models/tipos";

interface Persona { id: number; name: string; role: Rol }

export interface TicketCompleto extends Ticket {
  codigo: string;
  cliente: Persona;
  agente: Persona | null;
  categoria: string;
  sala: { id: number; name: string; slug: string } | null;
}

export interface TicketDetalle extends TicketCompleto {
  mensajes: (MensajeTicket & { autor: Persona })[];
  historial: (CambioEstado & { autor: Persona })[];
}

export interface Filtros {
  status?: EstadoTicket;
  priority?: Prioridad;
  category_id?: number;
  customer_id?: number;
  agent_id?: number | "ninguno";
  q?: string;
  orden?: "recientes" | "antiguos" | "prioridad";
}

type Fila = Ticket & {
  cliente_nombre: string; cliente_rol: Rol;
  agente_nombre: string | null; agente_rol: Rol | null;
  categoria: string;
  sala_nombre: string | null; sala_slug: string | null;
};

const SELECT_TICKET = `
  SELECT t.*,
         c.name AS cliente_nombre, c.role AS cliente_rol,
         a.name AS agente_nombre, a.role AS agente_rol,
         cat.name AS categoria,
         r.name AS sala_nombre, r.slug AS sala_slug
    FROM tickets t
    JOIN users c ON c.id = t.customer_id
    LEFT JOIN users a ON a.id = t.agent_id
    JOIN ticket_categories cat ON cat.id = t.category_id
    LEFT JOIN rooms r ON r.id = t.room_id`;

function completar(f: Fila): TicketCompleto {
  const { cliente_nombre, cliente_rol, agente_nombre, agente_rol, sala_nombre, sala_slug, ...t } = f;
  return {
    ...t,
    codigo: codigoTicket(t.id),
    cliente: { id: t.customer_id, name: cliente_nombre, role: cliente_rol },
    agente: t.agent_id ? { id: t.agent_id, name: agente_nombre!, role: agente_rol! } : null,
    sala: t.room_id && sala_nombre ? { id: t.room_id, name: sala_nombre, slug: sala_slug! } : null
  };
}

// Condición SQL de "lo que este usuario puede ver"
function visibilidad(yo: UsuarioPublico): { sql: string; valores: number[] } {
  if (yo.role === "cliente") return { sql: "t.customer_id = ?", valores: [yo.id] };
  if (yo.role === "agente") return { sql: "(t.agent_id = ? OR t.agent_id IS NULL)", valores: [yo.id] };
  return { sql: "TRUE", valores: [] };
}

export async function listar(yo: UsuarioPublico, filtros: Filtros): Promise<TicketCompleto[]> {
  const vis = visibilidad(yo);
  const condiciones = [vis.sql];
  const valores: (string | number)[] = [...vis.valores];
  if (filtros.status) { condiciones.push("t.status = ?"); valores.push(filtros.status); }
  if (filtros.priority) { condiciones.push("t.priority = ?"); valores.push(filtros.priority); }
  if (filtros.category_id) { condiciones.push("t.category_id = ?"); valores.push(filtros.category_id); }
  if (filtros.customer_id) { condiciones.push("t.customer_id = ?"); valores.push(filtros.customer_id); }
  if (filtros.agent_id === "ninguno") condiciones.push("t.agent_id IS NULL");
  else if (filtros.agent_id) { condiciones.push("t.agent_id = ?"); valores.push(filtros.agent_id); }
  if (filtros.q) {
    // Busca en asunto y descripción; "NXR-0004" o "4" también encuentran el ticket por su número
    const numero = Number(filtros.q.replace(/^NXR-?/i, ""));
    condiciones.push("(t.subject LIKE ? OR t.description LIKE ? OR t.id = ?)");
    valores.push(`%${filtros.q}%`, `%${filtros.q}%`, Number.isInteger(numero) ? numero : 0);
  }
  const orden = {
    recientes: "t.updated_at DESC, t.id DESC",
    antiguos: "t.created_at ASC, t.id ASC",
    prioridad: "FIELD(t.priority, 'alta', 'media', 'baja'), t.updated_at DESC"
  }[filtros.orden ?? "recientes"];
  const filas = await consultar<Fila>(`${SELECT_TICKET} WHERE ${condiciones.join(" AND ")} ORDER BY ${orden}`, valores);
  return filas.map(completar);
}

// Devuelve el ticket si este usuario puede verlo; si no, 404
async function visible(yo: UsuarioPublico, id: number, con?: PoolConnection): Promise<TicketCompleto> {
  const vis = visibilidad(yo);
  const sql = `${SELECT_TICKET} WHERE t.id = ? AND ${vis.sql}${con ? " FOR UPDATE" : ""}`;
  const filas = con
    ? ((await con.execute<RowDataPacket[]>(sql, [id, ...vis.valores]))[0] as Fila[])
    : await consultar<Fila>(sql, [id, ...vis.valores]);
  if (!filas.length) throw ErrorApi.noEncontrado("Ese ticket no existe o no tienes acceso.");
  return completar(filas[0]);
}

// Para escribir, el agente tiene que llevar el ticket (verlo sin asignar no basta)
function exigirQueLoLleve(yo: UsuarioPublico, t: Ticket): void {
  if (yo.role === "agente" && t.agent_id !== yo.id) {
    throw ErrorApi.prohibido(t.agent_id ? "Este ticket lo lleva otro agente." : "Asígnate el ticket antes de trabajar en él.");
  }
}

export async function detalle(yo: UsuarioPublico, id: number): Promise<TicketDetalle> {
  const ticket = await visible(yo, id);
  // El cliente nunca recibe las notas internas del equipo
  const soloPublicos = yo.role === "cliente" ? "AND m.is_internal = FALSE" : "";
  const mensajes = await consultar<MensajeTicket & { autor_nombre: string; autor_rol: Rol }>(
    `SELECT m.*, u.name AS autor_nombre, u.role AS autor_rol
       FROM ticket_messages m JOIN users u ON u.id = m.author_id
      WHERE m.ticket_id = ? ${soloPublicos}
      ORDER BY m.created_at, m.id`, [id]);
  const historial = await consultar<CambioEstado & { autor_nombre: string; autor_rol: Rol }>(
    `SELECT h.*, u.name AS autor_nombre, u.role AS autor_rol
       FROM ticket_status_history h JOIN users u ON u.id = h.changed_by_id
      WHERE h.ticket_id = ?
      ORDER BY h.changed_at, h.id`, [id]);
  return {
    ...ticket,
    mensajes: mensajes.map(({ autor_nombre, autor_rol, ...m }) => ({
      ...m, is_internal: Boolean(m.is_internal), autor: { id: m.author_id, name: autor_nombre, role: autor_rol }
    })),
    historial: historial.map(({ autor_nombre, autor_rol, ...h }) => ({
      ...h, autor: { id: h.changed_by_id, name: autor_nombre, role: autor_rol }
    }))
  };
}

export interface DatosNuevoTicket {
  subject: string;
  description: string;
  category_id: number;
  priority: Prioridad;
  room_id: number | null;
  booking_id: number | null;
  customer_id?: number; // solo el admin, para abrirlo en nombre de un cliente
}

export async function crear(yo: UsuarioPublico, datos: DatosNuevoTicket): Promise<TicketDetalle> {
  const clienteId = yo.role === "admin" && datos.customer_id ? datos.customer_id : yo.id;
  const errores: Record<string, string> = {};

  if (clienteId !== yo.id) {
    const [c] = await consultar<{ role: Rol }>("SELECT role FROM users WHERE id = ? AND is_active = TRUE", [clienteId]);
    if (c?.role !== "cliente") errores.customer_id = "Ese cliente no existe.";
  }
  const [cat] = await consultar<{ id: number }>("SELECT id FROM ticket_categories WHERE id = ? AND is_active = TRUE", [datos.category_id]);
  if (!cat) errores.category_id = "Esa categoría no existe.";

  let salaId = datos.room_id;
  if (datos.booking_id) {
    // La reserva tiene que ser del mismo cliente; si no se indicó sala, se toma la de la reserva
    const [b] = await consultar<{ room_id: number }>("SELECT room_id FROM bookings WHERE id = ? AND customer_id = ?", [datos.booking_id, clienteId]);
    if (!b) errores.booking_id = "Esa reserva no existe o no es tuya.";
    else if (salaId && salaId !== b.room_id) errores.room_id = "La sala no coincide con la de la reserva.";
    else salaId = b.room_id;
  }
  if (salaId && !errores.room_id) {
    const [r] = await consultar<{ id: number }>("SELECT id FROM rooms WHERE id = ?", [salaId]);
    if (!r) errores.room_id = "Esa sala no existe.";
  }
  if (Object.keys(errores).length) throw ErrorApi.datosInvalidos(errores);

  // El ticket, su primer mensaje y el primer estado del historial se guardan juntos
  const id = await enTransaccion(async con => {
    const [r] = await con.execute<ResultSetHeader>(
      `INSERT INTO tickets (customer_id, category_id, room_id, booking_id, subject, description, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clienteId, datos.category_id, salaId, datos.booking_id, datos.subject, datos.description, datos.priority]);
    await con.execute("INSERT INTO ticket_messages (ticket_id, author_id, body) VALUES (?, ?, ?)", [r.insertId, yo.id, datos.description]);
    await con.execute("INSERT INTO ticket_status_history (ticket_id, changed_by_id, old_status, new_status) VALUES (?, ?, NULL, 'abierto')", [r.insertId, yo.id]);
    return r.insertId;
  });
  return detalle(yo, id);
}

async function registrarEstado(con: PoolConnection, t: Ticket, nuevo: EstadoTicket, quien: number): Promise<void> {
  await con.execute(
    "UPDATE tickets SET status = ?, closed_at = IF(? = 'cerrado', CURRENT_TIMESTAMP, NULL) WHERE id = ?",
    [nuevo, nuevo, t.id]);
  await con.execute(
    "INSERT INTO ticket_status_history (ticket_id, changed_by_id, old_status, new_status) VALUES (?, ?, ?, ?)",
    [t.id, quien, t.status, nuevo]);
}

export async function responder(yo: UsuarioPublico, id: number, body: string, interno: boolean): Promise<TicketDetalle> {
  if (interno && yo.role === "cliente") throw ErrorApi.prohibido("Los clientes no pueden escribir notas internas.");
  await enTransaccion(async con => {
    const t = await visible(yo, id, con);
    exigirQueLoLleve(yo, t);
    if (t.status === "cerrado") throw ErrorApi.conflicto("El ticket está cerrado. Pide que se reabra para seguir escribiendo.");
    await con.execute("INSERT INTO ticket_messages (ticket_id, author_id, body, is_internal) VALUES (?, ?, ?, ?)", [id, yo.id, body, interno]);
    // Si el cliente contesta lo que le pidió el equipo, el ticket vuelve a "En curso"
    if (yo.role === "cliente" && t.status === "pendiente_cliente") await registrarEstado(con, t, "en_curso", yo.id);
    else await con.execute("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  });
  return detalle(yo, id);
}

// ¿Puede este usuario pasar el ticket de un estado a otro?
export function transicionPermitida(rol: Rol, desde: EstadoTicket, hasta: EstadoTicket): string | null {
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

export async function cambiarEstado(yo: UsuarioPublico, id: number, nuevo: EstadoTicket): Promise<TicketDetalle> {
  await enTransaccion(async con => {
    const t = await visible(yo, id, con);
    exigirQueLoLleve(yo, t);
    if (t.status === nuevo) return; // nada que cambiar, no se ensucia el historial
    const motivo = transicionPermitida(yo.role, t.status, nuevo);
    if (motivo) throw ErrorApi.prohibido(motivo);
    await registrarEstado(con, t, nuevo, yo.id);
  });
  return detalle(yo, id);
}

export async function actualizar(yo: UsuarioPublico, id: number, cambios: { priority?: Prioridad; category_id?: number }): Promise<TicketDetalle> {
  await enTransaccion(async con => {
    const t = await visible(yo, id, con);
    exigirQueLoLleve(yo, t);
    if (cambios.category_id !== undefined) {
      const [filas] = await con.execute<RowDataPacket[]>("SELECT id FROM ticket_categories WHERE id = ? AND is_active = TRUE", [cambios.category_id]);
      if (!filas.length) throw ErrorApi.datosInvalidos({ category_id: "Esa categoría no existe." });
    }
    await con.execute(
      "UPDATE tickets SET priority = COALESCE(?, priority), category_id = COALESCE(?, category_id) WHERE id = ?",
      [cambios.priority ?? null, cambios.category_id ?? null, id]);
  });
  return detalle(yo, id);
}

// Admin: asigna, reasigna o deja sin asignar (null). Agente: solo puede quedarse uno libre.
export async function asignar(yo: UsuarioPublico, id: number, agenteId: number | null): Promise<TicketDetalle> {
  await enTransaccion(async con => {
    const t = await visible(yo, id, con);
    if (yo.role === "agente" && (agenteId !== yo.id || t.agent_id !== null)) {
      throw ErrorApi.prohibido("Solo puedes quedarte tickets que estén sin asignar.");
    }
    if (agenteId !== null) {
      const [filas] = await con.execute<RowDataPacket[]>(
        "SELECT id FROM users WHERE id = ? AND role = 'agente' AND is_active = TRUE", [agenteId]);
      if (!filas.length) throw ErrorApi.datosInvalidos({ agent_id: "Ese agente no existe o está desactivado." });
    }
    await con.execute("UPDATE tickets SET agent_id = ? WHERE id = ?", [agenteId, id]);
  });
  return detalle(yo, id);
}
