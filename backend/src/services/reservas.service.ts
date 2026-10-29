// Reservas (mejora opcional del enunciado): horarios libres de cada sala y reservas de los clientes.
// Las horas son "de reloj" en Madrid: starts_at se guarda y se devuelve como AAAA-MM-DDTHH:MM:SS, sin zona.
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { consultar, ejecutar, enTransaccion } from "../db/conexion";
import { ErrorApi } from "../middleware/errores";
import type { EstadoReserva, Sala, UsuarioPublico } from "../models/tipos";
import * as salas from "./salas.service";

export const ESTADOS_RESERVA: readonly EstadoReserva[] = ["pendiente", "confirmada", "cancelada"];

// Pases de cada día. Las salas de más de 2 horas (San Tomás, 150 min) tienen menos.
const HORARIO = {
  normal: ["10:00", "12:00", "16:00", "18:00", "20:00", "22:00"],
  largo: ["10:00", "16:00", "19:30"]
};
export const horasDe = (sala: Pick<Sala, "duration_min">) => (sala.duration_min > 120 ? HORARIO.largo : HORARIO.normal);

// Fecha y hora actual en Madrid como "AAAA-MM-DDTHH:MM", para comparar con los pases
export function ahoraEnMadrid(fecha = new Date()): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(fecha).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

const COLUMNAS = `b.id, b.customer_id, b.room_id, DATE_FORMAT(b.starts_at, '%Y-%m-%dT%H:%i:%s') AS starts_at,
                  b.players, b.status, b.created_at`;

export interface Hueco { hora: string; starts_at: string; estado: "libre" | "ocupada" | "tuya" | "pasada" }

// No dice quién ha reservado: solo si el hueco está libre (o si es del propio cliente)
export async function huecos(salaId: number, desde: string, dias: number, yo?: UsuarioPublico) {
  const sala = await salas.buscar(salaId);
  const hasta = new Date(`${desde}T00:00:00Z`);
  hasta.setUTCDate(hasta.getUTCDate() + dias);
  const ocupadas = await consultar<{ starts_at: string; customer_id: number }>(
    `SELECT DATE_FORMAT(starts_at, '%Y-%m-%dT%H:%i:%s') AS starts_at, customer_id FROM bookings
      WHERE room_id = ? AND status <> 'cancelada' AND starts_at >= ? AND starts_at < ?`,
    [salaId, `${desde} 00:00:00`, hasta.toISOString().slice(0, 10) + " 00:00:00"]);
  const porHora = new Map(ocupadas.map(o => [o.starts_at, o.customer_id]));
  const ahora = ahoraEnMadrid();
  const resultado: { fecha: string; horas: Hueco[] }[] = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(`${desde}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const fecha = d.toISOString().slice(0, 10);
    resultado.push({
      fecha,
      horas: horasDe(sala).map(hora => {
        const starts_at = `${fecha}T${hora}:00`;
        const de = porHora.get(starts_at);
        const estado = starts_at.slice(0, 16) <= ahora ? "pasada" : de === undefined ? "libre" : de === yo?.id ? "tuya" : "ocupada";
        return { hora, starts_at, estado };
      })
    });
  }
  return resultado;
}

// La reserva queda "pendiente" hasta que el equipo la confirme
export async function crear(yo: UsuarioPublico, datos: { room_id: number; starts_at: string; players: number }) {
  const sala = await salas.buscar(datos.room_id).catch(() => {
    throw ErrorApi.datosInvalidos({ room_id: "Esa sala no existe." });
  });
  const [fecha, hora] = [datos.starts_at.slice(0, 10), datos.starts_at.slice(11, 16)];
  const errores: Record<string, string> = {};
  if (!horasDe(sala).includes(hora)) errores.starts_at = `Esa hora no es un pase de esta sala (${horasDe(sala).join(", ")}).`;
  else if (`${fecha}T${hora}` <= ahoraEnMadrid()) errores.starts_at = "Esa hora ya ha pasado.";
  if (datos.players < sala.min_players || datos.players > sala.max_players) {
    errores.players = `En esta sala jugáis de ${sala.min_players} a ${sala.max_players} personas.`;
  }
  if (Object.keys(errores).length) throw ErrorApi.datosInvalidos(errores);

  const inicio = `${fecha} ${hora}:00`;
  const id = await enTransaccion(async con => {
    // La tabla tiene UNIQUE (room_id, starts_at): si el hueco tuvo una reserva cancelada, se reutiliza esa fila
    const [filas] = await con.execute<RowDataPacket[]>(
      "SELECT id, status FROM bookings WHERE room_id = ? AND starts_at = ? FOR UPDATE", [sala.id, inicio]);
    const previa = filas[0] as { id: number; status: EstadoReserva } | undefined;
    if (previa && previa.status !== "cancelada") throw ErrorApi.conflicto("Alguien acaba de reservar esa hora. Elige otra.");
    if (previa) {
      await con.execute(
        "UPDATE bookings SET customer_id = ?, players = ?, status = 'pendiente', created_at = CURRENT_TIMESTAMP WHERE id = ?",
        [yo.id, datos.players, previa.id]);
      return previa.id;
    }
    const [r] = await con.execute<ResultSetHeader>(
      "INSERT INTO bookings (customer_id, room_id, starts_at, players) VALUES (?, ?, ?, ?)", [yo.id, sala.id, inicio, datos.players]);
    return r.insertId;
  });
  return buscar(id);
}

type FilaReserva = { id: number; customer_id: number; room_id: number; starts_at: string; players: number; status: EstadoReserva; created_at: Date;
  sala_nombre: string; sala_slug: string; sala_imagen: string | null; cliente_nombre: string };

const SELECT_RESERVA = `
  SELECT ${COLUMNAS}, r.name AS sala_nombre, r.slug AS sala_slug, r.image_url AS sala_imagen, u.name AS cliente_nombre
    FROM bookings b JOIN rooms r ON r.id = b.room_id JOIN users u ON u.id = b.customer_id`;

const completar = ({ sala_nombre, sala_slug, sala_imagen, cliente_nombre, ...b }: FilaReserva) => ({
  ...b,
  sala: { id: b.room_id, name: sala_nombre, slug: sala_slug, image_url: sala_imagen },
  cliente: { id: b.customer_id, name: cliente_nombre }
});

async function buscar(id: number) {
  const [f] = await consultar<FilaReserva>(`${SELECT_RESERVA} WHERE b.id = ?`, [id]);
  if (!f) throw ErrorApi.noEncontrado("Esa reserva no existe.");
  return completar(f);
}

export async function mias(yo: UsuarioPublico) {
  return (await consultar<FilaReserva>(`${SELECT_RESERVA} WHERE b.customer_id = ? ORDER BY b.starts_at DESC`, [yo.id])).map(completar);
}

// Panel del equipo: todas las reservas, con filtros
export async function listar(f: { status?: EstadoReserva; room_id?: number; desde?: string }) {
  const condiciones: string[] = [];
  const valores: (string | number)[] = [];
  if (f.status) { condiciones.push("b.status = ?"); valores.push(f.status); }
  if (f.room_id) { condiciones.push("b.room_id = ?"); valores.push(f.room_id); }
  if (f.desde) { condiciones.push("b.starts_at >= ?"); valores.push(`${f.desde} 00:00:00`); }
  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  return (await consultar<FilaReserva>(`${SELECT_RESERVA} ${donde} ORDER BY b.starts_at`, valores)).map(completar);
}

// Equipo (agente o admin): confirmar o cancelar. Cliente: solo cancelar una suya que aún no ha empezado.
export async function cambiarEstado(yo: UsuarioPublico, id: number, nuevo: EstadoReserva) {
  const reserva = await buscar(id);
  if (yo.role === "cliente") {
    if (reserva.customer_id !== yo.id) throw ErrorApi.noEncontrado("Esa reserva no existe.");
    if (nuevo !== "cancelada") throw ErrorApi.prohibido("Solo puedes cancelar tu reserva; la confirma el equipo.");
    if (reserva.starts_at.slice(0, 16) <= ahoraEnMadrid()) throw ErrorApi.conflicto("Esa partida ya ha empezado o ha pasado.");
  }
  if (reserva.status === "cancelada" && nuevo !== "cancelada") {
    throw ErrorApi.conflicto("Una reserva cancelada no se puede recuperar: hay que hacer una nueva.");
  }
  await ejecutar("UPDATE bookings SET status = ? WHERE id = ?", [nuevo, id]);
  return buscar(id);
}
