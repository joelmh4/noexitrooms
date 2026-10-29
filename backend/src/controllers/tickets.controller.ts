// Tickets: aquí solo se validan los datos de entrada; las reglas de quién puede hacer qué están en tickets.service
import type { RequestHandler } from "express";
import { ESTADOS, PRIORIDADES, type EstadoTicket, type Prioridad } from "../models/tipos";
import * as tickets from "../services/tickets.service";
import { comprobar, idDeRuta, texto, unoDe, type Errores } from "../services/validacion";

const ORDENES = ["recientes", "antiguos", "prioridad"] as const;

// Número entero positivo opcional (en el cuerpo o en la query)
function idOpcional(errores: Errores, campo: string, valor: unknown): number | undefined {
  if (valor === undefined || valor === null || valor === "") return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) { errores[campo] = "Tiene que ser un número de id."; return undefined; }
  return n;
}

// GET /tickets?status=&priority=&category_id=&customer_id=&agent_id=(id|ninguno)&q=&orden=
export const listar: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const q = req.query;
  const filtros: tickets.Filtros = {
    status: q.status ? unoDe(errores, "status", q.status, ESTADOS) : undefined,
    priority: q.priority ? unoDe(errores, "priority", q.priority, PRIORIDADES) : undefined,
    category_id: idOpcional(errores, "category_id", q.category_id),
    customer_id: idOpcional(errores, "customer_id", q.customer_id),
    agent_id: q.agent_id === "ninguno" ? "ninguno" : idOpcional(errores, "agent_id", q.agent_id),
    q: typeof q.q === "string" && q.q.trim() ? q.q.trim().slice(0, 100) : undefined,
    orden: q.orden ? unoDe(errores, "orden", q.orden, ORDENES) : undefined
  };
  comprobar(errores);
  res.json(await tickets.listar(req.usuario!, filtros));
};

export const detalle: RequestHandler = async (req, res) => {
  res.json(await tickets.detalle(req.usuario!, idDeRuta(String(req.params.id))));
};

// POST /tickets { subject, description, category_id, priority?, room_id?, booking_id?, customer_id? (admin) }
export const crear: RequestHandler = async (req, res) => {
  const errores: Errores = {};
  const b = req.body ?? {};
  const datos: tickets.DatosNuevoTicket = {
    subject: texto(errores, "subject", b.subject, { min: 5, max: 150, nombre: "El asunto" }),
    description: texto(errores, "description", b.description, { min: 20, max: 2000, nombre: "La descripción" }),
    category_id: idOpcional(errores, "category_id", b.category_id) ?? 0,
    priority: b.priority === undefined ? "media" : unoDe(errores, "priority", b.priority, PRIORIDADES),
    room_id: idOpcional(errores, "room_id", b.room_id) ?? null,
    booking_id: idOpcional(errores, "booking_id", b.booking_id) ?? null,
    customer_id: idOpcional(errores, "customer_id", b.customer_id)
  };
  if (!datos.category_id && !errores.category_id) errores.category_id = "Elige una categoría.";
  comprobar(errores);
  res.status(201).json(await tickets.crear(req.usuario!, datos));
};

// POST /tickets/:id/messages { body, is_internal? }
export const responder: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  const errores: Errores = {};
  const body = texto(errores, "body", req.body?.body, { min: 1, max: 5000, nombre: "el mensaje" });
  const interno = req.body?.is_internal ?? false;
  if (typeof interno !== "boolean") errores.is_internal = "Tiene que ser true o false.";
  comprobar(errores);
  res.status(201).json(await tickets.responder(req.usuario!, id, body, interno));
};

// PATCH /tickets/:id/status { status }
export const cambiarEstado: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  const errores: Errores = {};
  const status = unoDe<EstadoTicket>(errores, "status", req.body?.status, ESTADOS);
  comprobar(errores);
  res.json(await tickets.cambiarEstado(req.usuario!, id, status));
};

// PATCH /tickets/:id { priority?, category_id? } · agente que lo lleva o admin
export const actualizar: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  const errores: Errores = {};
  const cambios: { priority?: Prioridad; category_id?: number } = {};
  if (req.body?.priority !== undefined) cambios.priority = unoDe(errores, "priority", req.body.priority, PRIORIDADES);
  if (req.body?.category_id !== undefined) cambios.category_id = idOpcional(errores, "category_id", req.body.category_id);
  if (!Object.keys(cambios).length && !Object.keys(errores).length) errores.cambios = "Envía priority o category_id.";
  comprobar(errores);
  res.json(await tickets.actualizar(req.usuario!, id, cambios));
};

// PATCH /tickets/:id/assign { agent_id: número | null }
export const asignar: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  const errores: Errores = {};
  if (req.body?.agent_id === undefined) errores.agent_id = "Indica el agente (o null para dejarlo sin asignar).";
  const agenteId = req.body?.agent_id === null ? null : idOpcional(errores, "agent_id", req.body?.agent_id) ?? null;
  comprobar(errores);
  res.json(await tickets.asignar(req.usuario!, id, agenteId));
};
