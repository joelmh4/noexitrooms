// Reservas: el cliente reserva y ve las suyas; el equipo las consulta y las confirma o cancela
import type { RequestHandler } from "express";
import type { EstadoReserva } from "../models/tipos";
import * as reservas from "../services/reservas.service";
import { comprobar, idDeRuta, unoDe, type Errores } from "../services/validacion";

// POST /bookings { room_id, starts_at: "AAAA-MM-DDTHH:MM", players }
export const crear: RequestHandler = async (req, res) => {
  const b = req.body ?? {};
  const errores: Errores = {};
  const room_id = Number(b.room_id);
  if (!Number.isInteger(room_id) || room_id <= 0) errores.room_id = "Elige una sala.";
  const starts_at = typeof b.starts_at === "string" ? b.starts_at : "";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:00)?$/.test(starts_at)) errores.starts_at = "Elige un día y una hora.";
  const players = Number(b.players);
  if (!Number.isInteger(players) || players < 1) errores.players = "¿Cuántas personas vais a jugar?";
  comprobar(errores);
  res.status(201).json(await reservas.crear(req.usuario!, { room_id, starts_at, players }));
};

export const mias: RequestHandler = async (req, res) => {
  res.json(await reservas.mias(req.usuario!));
};

// GET /bookings?status=&room_id=&from=AAAA-MM-DD (agente o admin)
export const listar: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const q = req.query;
  const status = q.status ? unoDe(errores, "status", q.status, reservas.ESTADOS_RESERVA) : undefined;
  const room_id = q.room_id ? Number(q.room_id) : undefined;
  if (room_id !== undefined && (!Number.isInteger(room_id) || room_id <= 0)) errores.room_id = "Tiene que ser un número de id.";
  const desde = typeof q.from === "string" ? q.from : undefined;
  if (desde && !/^\d{4}-\d{2}-\d{2}$/.test(desde)) errores.from = "Usa el formato AAAA-MM-DD.";
  comprobar(errores);
  res.json(await reservas.listar({ status, room_id, desde }));
};

// PATCH /bookings/:id/status { status }
export const cambiarEstado: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  const errores: Errores = {};
  const status = unoDe<EstadoReserva>(errores, "status", req.body?.status, reservas.ESTADOS_RESERVA);
  comprobar(errores);
  res.json(await reservas.cambiarEstado(req.usuario!, id, status));
};
