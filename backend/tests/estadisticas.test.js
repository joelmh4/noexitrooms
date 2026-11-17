// Métricas del panel: cuadran con los tickets que ve cada rol
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { entrar, pedir } = require("./ayuda");

test("el admin ve las métricas de todo el equipo y cuadran con la lista de tickets", async () => {
    const token = await entrar("admin@noexitrooms.test");
    const [stats, tickets] = await Promise.all([pedir("/stats", { token }), pedir("/tickets", { token })]);
    assert.equal(stats.status, 200);
    const t = stats.datos.tickets;
    const lista = tickets.datos;
    assert.equal(t.total, lista.length);
    assert.equal(t.por_estado.abierto, lista.filter(x => x.status === "abierto").length);
    assert.equal(t.sin_asignar.total, lista.filter(x => x.agent_id === null && x.status !== "cerrado").length);
    assert.equal(t.activos, t.activos_por_prioridad.baja + t.activos_por_prioridad.media + t.activos_por_prioridad.alta);
    assert.ok(t.horas_medias_hasta_resolver === null || t.horas_medias_hasta_resolver >= 0);
    assert.ok(Array.isArray(stats.datos.agentes) && stats.datos.agentes.some((a) => a.name === "José Luis Ábalos"));
    assert.equal(typeof stats.datos.reservas.pendientes_de_confirmar, "number");
});

test("el agente solo ve sus métricas, sin las del resto del equipo", async () => {
    const token = await entrar("abalos@noexitrooms.test");
    const stats = await pedir("/stats", { token });
    assert.equal(stats.status, 200);
    const suyos = (await pedir("/tickets?agent_id=2", { token })).datos.length;
    assert.equal(stats.datos.tickets.total, suyos);
    assert.equal(stats.datos.agentes, undefined);
    assert.equal(stats.datos.reservas, undefined);
    assert.equal(stats.datos.tickets.sin_asignar, undefined);
});

test("el cliente no tiene métricas → 403", async () => {
    assert.equal((await pedir("/stats", { token: await entrar("pedro@ejemplo.test") })).status, 403);
    assert.equal((await pedir("/stats")).status, 401);
});
