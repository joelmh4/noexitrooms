// Tickets de punta a punta. Los números (02-05) son las pruebas de aceptación del enunciado.
// Cada prueba crea sus propios tickets, así se pueden repetir sin recargar la base de datos.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { emailNuevo, entrar, pedir } from "./ayuda";

let admin = "", marta = "", sergio = "", lucia = "", pablo = "";
const MARTA = 2, LUCIA = 4;

before(async () => {
  [admin, marta, sergio, lucia, pablo] = await Promise.all([
    entrar("admin@noexitrooms.test"), entrar("marta@noexitrooms.test"), entrar("sergio@noexitrooms.test"),
    entrar("lucia@ejemplo.test"), entrar("pablo@ejemplo.test")
  ]);
});

async function abrirTicket(token = lucia, extra: Record<string, unknown> = {}) {
  const r = await pedir("/tickets", {
    metodo: "POST", token,
    cuerpo: { subject: "Cambio de hora de la partida", description: "¿Podemos pasar la partida a las 20:00?", category_id: 1, ...extra }
  });
  assert.equal(r.status, 201, JSON.stringify(r.datos));
  return r.datos;
}

test("02 · el cliente abre un ticket y lo puede consultar después", async () => {
  const t = await abrirTicket();
  assert.equal(t.status, "abierto");
  assert.equal(t.priority, "media");
  assert.match(t.codigo, /^NXR-\d{4}$/);
  assert.equal(t.cliente.id, LUCIA);
  assert.equal(t.mensajes.length, 1, "la descripción es el primer mensaje");
  assert.deepEqual(t.historial.map((h: { new_status: string }) => h.new_status), ["abierto"]);

  const lista = await pedir("/tickets", { token: lucia });
  assert.ok(lista.datos.some((x: { id: number }) => x.id === t.id));
  const detalle = await pedir(`/tickets/${t.id}`, { token: lucia });
  assert.equal(detalle.status, 200);
  assert.equal(detalle.datos.subject, "Cambio de hora de la partida");
});

test("03 y 04 · el admin asigna, el agente responde y cambia el estado, y el cliente ve el historial", async () => {
  const t = await abrirTicket();

  const asignado = await pedir(`/tickets/${t.id}/assign`, { metodo: "PATCH", token: admin, cuerpo: { agent_id: MARTA } });
  assert.equal(asignado.status, 200);
  assert.equal(asignado.datos.agente.id, MARTA);

  assert.equal((await pedir(`/tickets/${t.id}/status`, { metodo: "PATCH", token: marta, cuerpo: { status: "en_curso" } })).status, 200);
  const r = await pedir(`/tickets/${t.id}/messages`, { metodo: "POST", token: marta, cuerpo: { body: "Hay hueco a las 20:00. ¿Os lo cambio?" } });
  assert.equal(r.status, 201);
  await pedir(`/tickets/${t.id}/messages`, { metodo: "POST", token: marta, cuerpo: { body: "Ojo: es cliente habitual.", is_internal: true } });
  assert.equal((await pedir(`/tickets/${t.id}/status`, { metodo: "PATCH", token: marta, cuerpo: { status: "pendiente_cliente" } })).status, 200);

  const visto = await pedir(`/tickets/${t.id}`, { token: lucia });
  assert.equal(visto.datos.status, "pendiente_cliente");
  assert.deepEqual(visto.datos.historial.map((h: { new_status: string }) => h.new_status), ["abierto", "en_curso", "pendiente_cliente"]);
  assert.equal(visto.datos.historial[1].autor.name, "Marta Gil", "se guarda quién hizo cada cambio");
  assert.equal(visto.datos.mensajes.length, 2, "el cliente no ve la nota interna");
  assert.ok(visto.datos.mensajes.every((m: { is_internal: boolean }) => !m.is_internal));

  const delEquipo = await pedir(`/tickets/${t.id}`, { token: marta });
  assert.equal(delEquipo.datos.mensajes.length, 3, "el agente sí ve la nota interna");
});

test("05 · otro cliente no puede ver ni tocar el ticket aunque cambie la URL → 404", async () => {
  const t = await abrirTicket();
  assert.equal((await pedir(`/tickets/${t.id}`, { token: pablo })).status, 404);
  assert.equal((await pedir(`/tickets/${t.id}/messages`, { metodo: "POST", token: pablo, cuerpo: { body: "hola" } })).status, 404);
  assert.equal((await pedir(`/tickets/${t.id}/status`, { metodo: "PATCH", token: pablo, cuerpo: { status: "cerrado" } })).status, 404);
  const lista = await pedir("/tickets", { token: pablo });
  assert.ok(lista.datos.every((x: { cliente: { id: number } }) => x.cliente.id !== LUCIA));
});

test("el cliente cierra un ticket resuelto o pide reabrirlo, pero no puede saltarse el flujo", async () => {
  const t = await abrirTicket();
  const estado = (token: string, status: string) => pedir(`/tickets/${t.id}/status`, { metodo: "PATCH", token, cuerpo: { status } });

  assert.equal((await estado(lucia, "resuelto")).status, 403, "no puede marcarlo como resuelto él mismo");
  await pedir(`/tickets/${t.id}/assign`, { metodo: "PATCH", token: admin, cuerpo: { agent_id: MARTA } });
  await estado(marta, "resuelto");
  assert.equal((await estado(lucia, "abierto")).status, 200, "pide la reapertura");
  await estado(marta, "resuelto");
  const cerrado = await estado(lucia, "cerrado");
  assert.equal(cerrado.status, 200);
  assert.ok(cerrado.datos.closed_at, "se guarda la fecha de cierre");

  const escribir = await pedir(`/tickets/${t.id}/messages`, { metodo: "POST", token: lucia, cuerpo: { body: "Una cosa más" } });
  assert.equal(escribir.status, 409, "en un ticket cerrado no se escribe");
});

test("si el cliente contesta a un ticket pendiente, vuelve solo a En curso", async () => {
  const t = await abrirTicket();
  await pedir(`/tickets/${t.id}/assign`, { metodo: "PATCH", token: admin, cuerpo: { agent_id: MARTA } });
  await pedir(`/tickets/${t.id}/status`, { metodo: "PATCH", token: marta, cuerpo: { status: "pendiente_cliente" } });
  const r = await pedir(`/tickets/${t.id}/messages`, { metodo: "POST", token: lucia, cuerpo: { body: "Somos 5 al final." } });
  assert.equal(r.datos.status, "en_curso");
});

test("el agente: no puede cerrar, no toca tickets de otro agente y solo se queda tickets libres", async () => {
  const t = await abrirTicket();
  const libre = await pedir(`/tickets/${t.id}`, { token: sergio });
  assert.equal(libre.status, 200, "ve los tickets sin asignar");
  const responderSinAsignar = await pedir(`/tickets/${t.id}/messages`, { metodo: "POST", token: sergio, cuerpo: { body: "hola" } });
  assert.equal(responderSinAsignar.status, 403, "primero tiene que asignárselo");

  assert.equal((await pedir(`/tickets/${t.id}/assign`, { metodo: "PATCH", token: sergio, cuerpo: { agent_id: MARTA } })).status, 403);
  assert.equal((await pedir(`/tickets/${t.id}/assign`, { metodo: "PATCH", token: sergio, cuerpo: { agent_id: 3 } })).status, 200);

  assert.equal((await pedir(`/tickets/${t.id}`, { token: marta })).status, 404, "Marta ya no lo ve: lo lleva Sergio");
  assert.equal((await pedir(`/tickets/${t.id}/status`, { metodo: "PATCH", token: sergio, cuerpo: { status: "cerrado" } })).status, 403);
  const prioridad = await pedir(`/tickets/${t.id}`, { metodo: "PATCH", token: sergio, cuerpo: { priority: "alta" } });
  assert.equal(prioridad.status, 200);
  assert.equal(prioridad.datos.priority, "alta");
  assert.equal((await pedir(`/tickets/${t.id}`, { metodo: "PATCH", token: lucia, cuerpo: { priority: "alta" } })).status, 403);
});

test("el admin filtra por estado, prioridad, cliente, agente y texto", async () => {
  const t = await abrirTicket(lucia, { subject: "Gafas olvidadas en el camarote", priority: "alta" });
  const buscar = async (query: string) => (await pedir(`/tickets?${query}`, { token: admin })).datos as { id: number }[];
  assert.ok((await buscar("q=gafas olvidadas")).some(x => x.id === t.id));
  assert.ok((await buscar(`q=${t.codigo}`)).some(x => x.id === t.id), "busca por código NXR-");
  assert.ok((await buscar(`priority=alta&status=abierto&customer_id=${LUCIA}&agent_id=ninguno`)).some(x => x.id === t.id));
  assert.ok(!(await buscar("priority=baja")).some(x => x.id === t.id));
  assert.equal((await pedir("/tickets?status=inventado", { token: admin })).status, 400);
});

test("el cliente filtra sus tickets por estado", async () => {
  const lista = (await pedir("/tickets?status=abierto", { token: lucia })).datos as { status: string; cliente: { id: number } }[];
  assert.ok(lista.length > 0);
  assert.ok(lista.every(t => t.status === "abierto" && t.cliente.id === LUCIA));
});

test("crear ticket: validación, reserva de otro cliente y roles", async () => {
  const mal = await pedir("/tickets", { metodo: "POST", token: lucia, cuerpo: { subject: "", description: "corta", category_id: 999 } });
  assert.equal(mal.status, 400);
  assert.ok(mal.datos.error.campos.subject && mal.datos.error.campos.description);

  const categoria = await pedir("/tickets", { metodo: "POST", token: lucia, cuerpo: { subject: "Asunto válido", description: "Descripción suficiente", category_id: 999 } });
  assert.equal(categoria.datos.error.campos.category_id, "Esa categoría no existe.");

  // La reserva 2 es de Pablo
  const ajena = await pedir("/tickets", { metodo: "POST", token: lucia, cuerpo: { subject: "Asunto válido", description: "Descripción suficiente", category_id: 1, booking_id: 2 } });
  assert.equal(ajena.status, 400);
  // La reserva 1 es de Lucía, en la sala 1: la sala se rellena sola
  const conReserva = await abrirTicket(lucia, { booking_id: 1 });
  assert.equal(conReserva.sala.id, 1);

  assert.equal((await pedir("/tickets", { metodo: "POST", token: marta, cuerpo: { subject: "x" } })).status, 403, "el agente no abre tickets");
  const enNombre = await abrirTicket(admin, { customer_id: LUCIA });
  assert.equal(enNombre.cliente.id, LUCIA, "el admin puede abrirlo en nombre de un cliente");
  assert.equal((await pedir("/tickets")).status, 401);
});

test("categorías: públicas para leer, solo el admin las gestiona", async () => {
  const publicas = await pedir("/categories");
  assert.equal(publicas.status, 200);
  assert.ok(publicas.datos.length >= 6);
  assert.equal((await pedir("/categories?all=1")).status, 401);
  assert.equal((await pedir("/categories?all=1", { token: lucia })).status, 403);
  assert.equal((await pedir("/categories", { metodo: "POST", token: lucia, cuerpo: { name: "Otra" } })).status, 403);

  const nombre = `Prueba ${Date.now()}`;
  const creada = await pedir("/categories", { metodo: "POST", token: admin, cuerpo: { name: nombre } });
  assert.equal(creada.status, 201);
  assert.equal((await pedir("/categories", { metodo: "POST", token: admin, cuerpo: { name: nombre.toUpperCase() } })).status, 409);
  const off = await pedir(`/categories/${creada.datos.id}`, { metodo: "PUT", token: admin, cuerpo: { is_active: false } });
  assert.equal(off.datos.is_active, false);
  assert.ok(!(await pedir("/categories")).datos.some((c: { id: number }) => c.id === creada.datos.id), "las desactivadas no salen al público");
  assert.ok((await pedir("/categories?all=1", { token: admin })).datos.some((c: { id: number }) => c.id === creada.datos.id));
});

test("un cliente nuevo empieza sin tickets", async () => {
  const r = await pedir("/auth/register", { metodo: "POST", cuerpo: { name: "Nuevo", email: emailNuevo("nuevo"), password: "Prueba123" } });
  assert.deepEqual((await pedir("/tickets", { token: r.datos.token })).datos, []);
});
