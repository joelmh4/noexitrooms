// Salas (CRUD del módulo temático) y reservas. La 07 es la prueba de aceptación del enunciado.
// Las pruebas de reservas usan una sala creada aquí, así cada ejecución tiene los huecos libres.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { entrar, pedir } from "./ayuda";

let admin = "", marta = "", lucia = "", pablo = "";
let sala: { id: number; slug: string; min_players: number; max_players: number };

const salaDePrueba = (extra: Record<string, unknown> = {}) => ({
  name: `Sala de prueba ${Date.now()} ${Math.floor(Math.random() * 1e4)}`,
  theme: "Misterio", difficulty: 3, duration_min: 60, min_players: 2, max_players: 6,
  price_per_person: 19.5, description: "Una sala creada por las pruebas automáticas de la API.", tagline: "Solo para pruebas",
  ...extra
});

// Un día dentro de un mes, para que la hora no haya pasado
function diaFuturo(dias = 30): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

before(async () => {
  [admin, marta, lucia, pablo] = await Promise.all([
    entrar("admin@noexitrooms.test"), entrar("marta@noexitrooms.test"), entrar("lucia@ejemplo.test"), entrar("pablo@ejemplo.test")
  ]);
  const r = await pedir("/rooms", { metodo: "POST", token: admin, cuerpo: salaDePrueba() });
  assert.equal(r.status, 201, JSON.stringify(r.datos));
  sala = r.datos;
});

test("07 · el admin crea, edita y borra una sala, y los cambios persisten", async () => {
  const datos = salaDePrueba({ name: `La cripta ${Date.now()}` });
  const creada = await pedir("/rooms", { metodo: "POST", token: admin, cuerpo: datos });
  assert.equal(creada.status, 201);
  assert.match(creada.datos.slug, /^la-cripta-\d+$/);
  assert.equal(creada.datos.price_per_person, 19.5, "el precio llega como número");

  const leida = await pedir(`/rooms/${creada.datos.slug}`);
  assert.equal(leida.status, 200);
  assert.equal(leida.datos.name, datos.name);

  const editada = await pedir(`/rooms/${creada.datos.id}`, { metodo: "PUT", token: admin, cuerpo: { ...datos, difficulty: 5, price_per_person: 25 } });
  assert.equal(editada.status, 200);
  assert.equal((await pedir(`/rooms/${creada.datos.slug}`)).datos.difficulty, 5, "el cambio se ha guardado");

  assert.equal((await pedir(`/rooms/${creada.datos.id}`, { metodo: "DELETE", token: admin })).status, 204);
  assert.equal((await pedir(`/rooms/${creada.datos.slug}`)).status, 404, "ya no existe");
});

test("solo el admin gestiona salas", async () => {
  assert.equal((await pedir("/rooms", { metodo: "POST", cuerpo: salaDePrueba() })).status, 401);
  assert.equal((await pedir("/rooms", { metodo: "POST", token: lucia, cuerpo: salaDePrueba() })).status, 403);
  assert.equal((await pedir("/rooms", { metodo: "POST", token: marta, cuerpo: salaDePrueba() })).status, 403);
  assert.equal((await pedir("/rooms/1", { metodo: "DELETE", token: lucia })).status, 403);
  assert.equal((await pedir("/rooms?all=1", { token: lucia })).status, 403);
});

test("validación de salas y nombre repetido", async () => {
  const mal = await pedir("/rooms", { metodo: "POST", token: admin, cuerpo: { name: "X", difficulty: 9, duration_min: 5, min_players: 4, max_players: 2, price_per_person: -1, description: "corta" } });
  assert.equal(mal.status, 400);
  for (const campo of ["name", "theme", "difficulty", "duration_min", "max_players", "price_per_person", "description"]) {
    assert.ok(mal.datos.error.campos[campo], `falta el error de ${campo}`);
  }
  const repetida = await pedir("/rooms", { metodo: "POST", token: admin, cuerpo: salaDePrueba({ name: "El manicomio de San Tomás" }) });
  assert.equal(repetida.status, 409);
});

test("una sala con tickets o reservas no se borra: se desactiva y deja de salir al público", async () => {
  assert.equal((await pedir("/rooms/1", { metodo: "DELETE", token: admin })).status, 409);
  const nueva = (await pedir("/rooms", { metodo: "POST", token: admin, cuerpo: salaDePrueba() })).datos;
  await pedir(`/rooms/${nueva.id}`, { metodo: "PUT", token: admin, cuerpo: { ...nueva, is_active: false } });
  assert.equal((await pedir(`/rooms/${nueva.slug}`)).status, 404);
  assert.ok(!(await pedir("/rooms")).datos.some((s: { id: number }) => s.id === nueva.id));
  assert.ok((await pedir("/rooms?all=1", { token: admin })).datos.some((s: { id: number }) => s.id === nueva.id));
});

test("08 · el catálogo se puede buscar y filtrar", async () => {
  const buscar = async (q: string) => (await pedir(`/rooms?${q}`)).datos as { name: string; theme: string; difficulty: number; min_players: number; max_players: number }[];
  assert.ok((await buscar("q=manicomio")).some(s => s.name === "El manicomio de San Tomás"));
  assert.ok((await buscar("theme=Humor")).every(s => s.theme === "Humor"));
  assert.ok((await buscar("difficulty=5")).every(s => s.difficulty === 5));
  assert.ok((await buscar("players=7")).every(s => s.min_players <= 7 && s.max_players >= 7));
  const porPrecio = (await pedir("/rooms?orden=precio")).datos as { price_per_person: number }[];
  assert.deepEqual(porPrecio.map(s => s.price_per_person), [...porPrecio.map(s => s.price_per_person)].sort((a, b) => a - b));
  assert.equal((await pedir("/rooms?difficulty=9")).status, 400);
});

test("huecos: horario de la sala, sin decir quién reservó", async () => {
  const r = await pedir(`/rooms/${sala.id}/slots?from=${diaFuturo()}&days=3`);
  assert.equal(r.status, 200);
  assert.equal(r.datos.length, 3);
  assert.deepEqual(r.datos[0].horas.map((h: { hora: string }) => h.hora), ["10:00", "12:00", "16:00", "18:00", "20:00", "22:00"]);
  assert.ok(r.datos[0].horas.every((h: { estado: string }) => h.estado === "libre"));

  const sanTomas = await pedir(`/rooms/3/slots?from=${diaFuturo()}&days=1`);
  assert.deepEqual(sanTomas.datos[0].horas.map((h: { hora: string }) => h.hora), ["10:00", "16:00", "19:30"], "San Tomás dura 150 min: menos pases");
  assert.equal((await pedir(`/rooms/${sala.id}/slots?from=mañana`)).status, 400);
});

test("reservar: queda pendiente, el hueco sale como tuya u ocupada y no se puede repetir", async () => {
  const dia = diaFuturo(31);
  const reserva = await pedir("/bookings", { metodo: "POST", token: lucia, cuerpo: { room_id: sala.id, starts_at: `${dia}T18:00`, players: 4 } });
  assert.equal(reserva.status, 201, JSON.stringify(reserva.datos));
  assert.equal(reserva.datos.status, "pendiente");
  assert.equal(reserva.datos.starts_at, `${dia}T18:00:00`);

  const estado = async (token?: string) =>
    (await pedir(`/rooms/${sala.id}/slots?from=${dia}&days=1`, { token })).datos[0].horas.find((h: { hora: string }) => h.hora === "18:00").estado;
  assert.equal(await estado(lucia), "tuya");
  assert.equal(await estado(pablo), "ocupada");
  assert.equal(await estado(), "ocupada");

  const repetida = await pedir("/bookings", { metodo: "POST", token: pablo, cuerpo: { room_id: sala.id, starts_at: `${dia}T18:00`, players: 3 } });
  assert.equal(repetida.status, 409);
  assert.ok((await pedir("/bookings/me", { token: lucia })).datos.some((b: { id: number }) => b.id === reserva.datos.id));
  assert.ok(!(await pedir("/bookings/me", { token: pablo })).datos.some((b: { id: number }) => b.id === reserva.datos.id));
});

test("reservar: hora que no es un pase, hora pasada, jugadores fuera de rango y roles", async () => {
  const dia = diaFuturo(32);
  const pedirReserva = (cuerpo: Record<string, unknown>, token = lucia) => pedir("/bookings", { metodo: "POST", token, cuerpo });
  assert.ok((await pedirReserva({ room_id: sala.id, starts_at: `${dia}T11:00`, players: 3 })).datos.error.campos.starts_at);
  assert.ok((await pedirReserva({ room_id: sala.id, starts_at: "2020-01-01T18:00", players: 3 })).datos.error.campos.starts_at);
  assert.ok((await pedirReserva({ room_id: sala.id, starts_at: `${dia}T18:00`, players: 9 })).datos.error.campos.players);
  assert.equal((await pedirReserva({ room_id: sala.id, starts_at: `${dia}T18:00`, players: 3 }, marta)).status, 403, "el agente no reserva");
  assert.equal((await pedir("/bookings", { metodo: "POST", cuerpo: {} })).status, 401);
});

test("el equipo confirma; el cliente solo cancela la suya, y el hueco cancelado se puede volver a reservar", async () => {
  const dia = diaFuturo(33);
  const r = (await pedir("/bookings", { metodo: "POST", token: lucia, cuerpo: { room_id: sala.id, starts_at: `${dia}T20:00`, players: 2 } })).datos;
  const estado = (token: string, status: string) => pedir(`/bookings/${r.id}/status`, { metodo: "PATCH", token, cuerpo: { status } });

  assert.equal((await estado(lucia, "confirmada")).status, 403, "el cliente no se la confirma");
  assert.equal((await estado(pablo, "cancelada")).status, 404, "ni toca las de otro");
  assert.equal((await estado(marta, "confirmada")).datos.status, "confirmada");
  assert.ok((await pedir(`/bookings?status=confirmada&room_id=${sala.id}`, { token: marta })).datos.some((b: { id: number }) => b.id === r.id));
  assert.equal((await pedir("/bookings", { token: lucia })).status, 403);

  assert.equal((await estado(lucia, "cancelada")).datos.status, "cancelada");
  const otra = await pedir("/bookings", { metodo: "POST", token: pablo, cuerpo: { room_id: sala.id, starts_at: `${dia}T20:00`, players: 5 } });
  assert.equal(otra.status, 201, "el hueco ha quedado libre");
  assert.equal(otra.datos.cliente.name, "Pablo Ruiz");
});
