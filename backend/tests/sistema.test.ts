// Esqueleto: la API arranca, responde con JSON y trata bien los errores
import { test } from "node:test";
import assert from "node:assert/strict";
import { pedir } from "./ayuda";

test("GET /health responde ok y llega a la base de datos", async () => {
  const r = await pedir("/health");
  assert.equal(r.status, 200);
  assert.equal(r.datos.baseDeDatos, "ok");
});

test("una ruta que no existe devuelve 404 con el formato de error", async () => {
  const r = await pedir("/no-existe");
  assert.equal(r.status, 404);
  assert.equal(r.datos.error.codigo, "NO_ENCONTRADO");
});

test("un cuerpo que no es JSON devuelve 400", async () => {
  const r = await pedir("/auth/login", { metodo: "POST", cuerpo: "{malo" });
  assert.equal(r.status, 400);
  assert.equal(r.datos.error.codigo, "JSON_INVALIDO");
});

test("la documentación Swagger está publicada", async () => {
  const r = await pedir("/openapi.json");
  assert.equal(r.status, 200);
  assert.ok(r.datos.paths["/auth/login"]);
});
