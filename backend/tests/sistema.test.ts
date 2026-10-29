// Pruebas básicas del esqueleto: la API arranca, responde con JSON y trata bien los errores.
// Necesitan un .env con una base de datos de pruebas (npm run db:cargar antes).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { app } from "../src/app";
import { pool } from "../src/db/conexion";

let servidor: Server;
let base = "";

before(async () => {
  servidor = app.listen(0);
  await new Promise(r => servidor.once("listening", r));
  const direccion = servidor.address();
  base = `http://127.0.0.1:${typeof direccion === "object" && direccion ? direccion.port : 0}/api`;
});
after(async () => { servidor.close(); await pool.end(); });

test("GET /health responde ok y llega a la base de datos", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual({ ...(await res.json()), hora: undefined }, { api: "ok", baseDeDatos: "ok", hora: undefined });
});

test("una ruta que no existe devuelve 404 con el formato de error", async () => {
  const res = await fetch(`${base}/no-existe`);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).error.codigo, "NO_ENCONTRADO");
});

test("un cuerpo que no es JSON devuelve 400", async () => {
  const res = await fetch(`${base}/health`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{malo" });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error.codigo, "JSON_INVALIDO");
});

test("la documentación Swagger está publicada", async () => {
  const res = await fetch(`${base}/openapi.json`);
  assert.equal(res.status, 200);
  assert.ok((await res.json()).paths["/health"]);
});
