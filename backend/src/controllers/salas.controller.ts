// Salas: catálogo público con buscador y CRUD del administrador
import type { RequestHandler } from "express";
import { ErrorApi } from "../middleware/errores";
import * as salas from "../services/salas.service";
import * as reservas from "../services/reservas.service";
import { comprobar, idDeRuta, texto, unoDe, type Errores } from "../services/validacion";

const ORDENES = ["nombre", "dificultad", "precio", "duracion"] as const;
export const pideTodas = (valor: unknown) => valor === "1" || valor === "true";

// Entero dentro de un rango (las mismas reglas que los CHECK de la tabla rooms)
function entero(errores: Errores, campo: string, valor: unknown, min: number, max: number, mensaje: string): number {
  const n = Number(valor);
  if (valor === "" || valor === null || !Number.isInteger(n) || n < min || n > max) errores[campo] = mensaje;
  return n;
}

// GET /rooms?q=&theme=&difficulty=&players=&orden= · ?all=1 también las desactivadas (admin)
export const listar: RequestHandler = async (req, res) => {
  const todas = pideTodas(req.query.all);
  if (todas && req.usuario?.role !== "admin") throw ErrorApi.prohibido();
  const errores: Errores = {};
  const q = req.query;
  const filtros: salas.FiltrosSalas = {
    todas,
    q: typeof q.q === "string" && q.q.trim() ? q.q.trim().slice(0, 100) : undefined,
    theme: typeof q.theme === "string" && q.theme.trim() ? q.theme.trim() : undefined,
    difficulty: q.difficulty ? entero(errores, "difficulty", q.difficulty, 1, 5, "Entre 1 y 5.") : undefined,
    players: q.players ? entero(errores, "players", q.players, 1, 99, "Número de jugadores no válido.") : undefined,
    orden: q.orden ? unoDe(errores, "orden", q.orden, ORDENES) : undefined
  };
  comprobar(errores);
  res.json(await salas.listar(filtros));
};

// GET /rooms/:slug (web pública) · también acepta el id numérico
export const detalle: RequestHandler = async (req, res) => {
  const clave = String(req.params.slug);
  res.json(await salas.buscar(/^\d+$/.test(clave) ? Number(clave) : clave));
};

function leerSala(cuerpo: Record<string, unknown> | undefined): salas.DatosSala {
  const b = cuerpo ?? {};
  const errores: Errores = {};
  const datos: salas.DatosSala = {
    name: texto(errores, "name", b.name, { min: 3, max: 100, nombre: "El nombre" }),
    theme: texto(errores, "theme", b.theme, { min: 3, max: 50, nombre: "La temática" }),
    difficulty: entero(errores, "difficulty", b.difficulty, 1, 5, "Entre 1 y 5."),
    duration_min: entero(errores, "duration_min", b.duration_min, 15, 180, "Entre 15 y 180 minutos."),
    min_players: entero(errores, "min_players", b.min_players, 1, 20, "Entre 1 y 20."),
    max_players: entero(errores, "max_players", b.max_players, 1, 20, "Entre 1 y 20."),
    price_per_person: Number(b.price_per_person),
    description: texto(errores, "description", b.description, { min: 20, max: 5000, nombre: "La descripción" }),
    tagline: typeof b.tagline === "string" && b.tagline.trim() ? texto(errores, "tagline", b.tagline, { max: 150, nombre: "La frase" }) : null,
    min_age: b.min_age === undefined || b.min_age === null ? 0 : entero(errores, "min_age", b.min_age, 0, 99, "Entre 0 y 99."),
    image_url: typeof b.image_url === "string" && b.image_url.trim() ? texto(errores, "image_url", b.image_url, { max: 255, nombre: "La ruta de la imagen" }) : null,
    is_active: b.is_active === undefined ? true : (b.is_active as boolean)
  };
  if (b.price_per_person === "" || b.price_per_person === null || !Number.isFinite(datos.price_per_person) ||
      datos.price_per_person < 0 || datos.price_per_person > 9999) errores.price_per_person = "Escribe un precio entre 0 y 9999.";
  if (!errores.min_players && !errores.max_players && datos.max_players < datos.min_players) {
    errores.max_players = "No puede ser menor que el mínimo.";
  }
  if (typeof datos.is_active !== "boolean") errores.is_active = "Tiene que ser true o false.";
  comprobar(errores);
  datos.price_per_person = Math.round(datos.price_per_person * 100) / 100;
  return datos;
}

export const crear: RequestHandler = async (req, res) => {
  res.status(201).json(await salas.crear(leerSala(req.body)));
};

export const actualizar: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  res.json(await salas.actualizar(id, leerSala(req.body)));
};

export const borrar: RequestHandler = async (req, res) => {
  await salas.borrar(idDeRuta(String(req.params.id)));
  res.status(204).end();
};

// GET /rooms/:id/slots?from=AAAA-MM-DD&days=7
export const huecos: RequestHandler = async (req, res) => {
  const id = idDeRuta(String(req.params.id));
  const errores: Errores = {};
  const desde = typeof req.query.from === "string" ? req.query.from : reservas.ahoraEnMadrid().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || Number.isNaN(Date.parse(`${desde}T00:00:00Z`))) errores.from = "Usa el formato AAAA-MM-DD.";
  const dias = req.query.days === undefined ? 7 : entero(errores, "days", req.query.days, 1, 31, "Entre 1 y 31 días.");
  comprobar(errores);
  res.json(await reservas.huecos(id, desde, dias, req.usuario));
};
