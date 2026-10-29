// Métricas del panel: cuadran con los tickets que ve cada rol
import { test } from "node:test";
import assert from "node:assert/strict";
import { entrar, pedir } from "./ayuda";

test("el admin ve las métricas de todo el equipo y cuadran con la lista de tickets", async () => {
  const token = await entrar("admin@noexitrooms.test");
  const [stats, tickets] = await Promise.all([pedir("/stats", { token }), pedir("/tickets", { token })]);
  assert.equal(stats.status, 200);
  const t = stats.datos.tickets;
  const lista = tickets.datos as { status: string; agent_id: number | null }[];
  assert.equal(t.total, lista.length);
  assert.equal(t.por_estado.abierto, lista.filter(x => x.status === "abierto").length);
  assert.equal(t.sin_asignar.total, lista.filter(x => x.agent_id === null && x.status !== "cerrado").length);
  assert.equal(t.activos, t.activos_por_prioridad.baja + t.activos_por_prioridad.media + t.activos_por_prioridad.alta);
  assert.ok(t.horas_medias_hasta_resolver === null || t.horas_medias_hasta_resolver >= 0);
  assert.ok(Array.isArray(stats.datos.agentes) && stats.datos.agentes.some((a: { name: string }) => a.name === "Marta Gil"));
  assert.equal(typeof stats.datos.reservas.pendientes_de_confirmar, "number");
});

test("el agente solo ve sus métricas, sin las del resto del equipo", async () => {
  const token = await entrar("marta@noexitrooms.test");
  const stats = await pedir("/stats", { token });
  assert.equal(stats.status, 200);
  const suyos = ((await pedir("/tickets?agent_id=2", { token })).datos as unknown[]).length;
  assert.equal(stats.datos.tickets.total, suyos);
  assert.equal(stats.datos.agentes, undefined);
  assert.equal(stats.datos.reservas, undefined);
});

test("el cliente no tiene métricas → 403", async () => {
  assert.equal((await pedir("/stats", { token: await entrar("lucia@ejemplo.test") })).status, 403);
  assert.equal((await pedir("/stats")).status, 401);
});
