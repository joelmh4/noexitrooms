// Autenticación y roles. Los números (01, 06) son las pruebas de aceptación del enunciado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { emailNuevo, entrar, pedir } from "./ayuda";

test("01 · un visitante se registra y su cuenta nace como cliente aunque pida ser admin", async () => {
  const email = emailNuevo("visitante");
  const r = await pedir("/auth/register", { metodo: "POST", cuerpo: { name: "Visitante", email, password: "Prueba123", role: "admin" } });
  assert.equal(r.status, 201);
  assert.equal(r.datos.usuario.role, "cliente");
  assert.ok(r.datos.token);
  assert.equal(r.datos.usuario.password_hash, undefined, "nunca se devuelve el hash");
  const yo = await pedir("/users/me", { token: r.datos.token });
  assert.equal(yo.datos.role, "cliente");
});

test("registro con email repetido → 409", async () => {
  const r = await pedir("/auth/register", { metodo: "POST", cuerpo: { name: "Otra Lucía", email: "LUCIA@ejemplo.test", password: "Prueba123" } });
  assert.equal(r.status, 409);
});

test("registro con datos inválidos → 400 con el campo que falla", async () => {
  const r = await pedir("/auth/register", { metodo: "POST", cuerpo: { name: "A", email: "no-es-email", password: "corta" } });
  assert.equal(r.status, 400);
  assert.deepEqual(Object.keys(r.datos.error.campos).sort(), ["email", "name", "password"]);
});

test("la contraseña se guarda con hash (el login funciona y el texto plano no está en la base de datos)", async () => {
  const email = emailNuevo("hash");
  await pedir("/auth/register", { metodo: "POST", cuerpo: { name: "Hash", email, password: "Prueba123" } });
  const { pool } = await import("../src/db/conexion");
  const [filas] = await pool.query("SELECT password_hash FROM users WHERE email = ?", [email]);
  const hash = (filas as { password_hash: string }[])[0].password_hash;
  assert.match(hash, /^\$2[aby]\$10\$/);
  assert.notEqual(hash, "Prueba123");
});

test("login con contraseña incorrecta → 401 con mensaje genérico", async () => {
  const mala = await pedir("/auth/login", { metodo: "POST", cuerpo: { email: "lucia@ejemplo.test", password: "mal" } });
  const noExiste = await pedir("/auth/login", { metodo: "POST", cuerpo: { email: "nadie@ejemplo.test", password: "mal" } });
  assert.equal(mala.status, 401);
  assert.equal(noExiste.status, 401);
  assert.equal(mala.datos.error.mensaje, noExiste.datos.error.mensaje, "no revela qué emails existen");
});

test("sin token o con token falso → 401", async () => {
  assert.equal((await pedir("/users/me")).status, 401);
  assert.equal((await pedir("/users/me", { token: "inventado" })).status, 401);
});

test("06 · un cliente no puede entrar en la gestión de usuarios → 403 del servidor", async () => {
  const token = await entrar("lucia@ejemplo.test");
  assert.equal((await pedir("/users", { token })).status, 403);
  assert.equal((await pedir("/users/5", { metodo: "PATCH", token, cuerpo: { role: "admin" } })).status, 403);
});

test("el agente solo puede ver la lista de agentes", async () => {
  const token = await entrar("marta@noexitrooms.test");
  const agentes = await pedir("/users?role=agente", { token });
  assert.equal(agentes.status, 200);
  assert.ok(agentes.datos.every((u: { role: string }) => u.role === "agente"));
  assert.equal((await pedir("/users", { token })).status, 403);
});

test("el admin lista y filtra usuarios", async () => {
  const token = await entrar("admin@noexitrooms.test");
  const todos = await pedir("/users", { token });
  assert.equal(todos.status, 200);
  const busqueda = await pedir("/users?q=lucia", { token });
  assert.ok(busqueda.datos.some((u: { email: string }) => u.email === "lucia@ejemplo.test"));
  assert.equal((await pedir("/users?role=jefe", { token })).status, 400);
});

test("el admin cambia el rol de un usuario, y el cambio manda aunque el token sea anterior", async () => {
  const admin = await entrar("admin@noexitrooms.test");
  const email = emailNuevo("ascenso");
  const nuevo = await pedir("/auth/register", { metodo: "POST", cuerpo: { name: "Futuro agente", email, password: "Prueba123" } });
  const r = await pedir(`/users/${nuevo.datos.usuario.id}`, { metodo: "PATCH", token: admin, cuerpo: { role: "agente" } });
  assert.equal(r.status, 200);
  assert.equal(r.datos.role, "agente");
  // Con su token antiguo (que decía cliente) ya actúa como agente
  assert.equal((await pedir("/users?role=agente", { token: nuevo.datos.token })).status, 200);
  // Si se le desactiva, su token deja de servir
  await pedir(`/users/${nuevo.datos.usuario.id}`, { metodo: "PATCH", token: admin, cuerpo: { is_active: false } });
  assert.equal((await pedir("/users/me", { token: nuevo.datos.token })).status, 403);
  assert.equal((await pedir("/auth/login", { metodo: "POST", cuerpo: { email, password: "Prueba123" } })).status, 403);
});

test("el admin no puede quitarse su propio rol", async () => {
  const token = await entrar("admin@noexitrooms.test");
  const yo = await pedir("/users/me", { token });
  assert.equal((await pedir(`/users/${yo.datos.id}`, { metodo: "PATCH", token, cuerpo: { role: "cliente" } })).status, 409);
});

test("perfil: editar nombre y cambiar contraseña", async () => {
  const email = emailNuevo("perfil");
  const r = await pedir("/auth/register", { metodo: "POST", cuerpo: { name: "Perfil", email, password: "Prueba123" } });
  const token = r.datos.token;
  const editado = await pedir("/users/me", { metodo: "PUT", token, cuerpo: { name: "Perfil Nuevo", email } });
  assert.equal(editado.datos.name, "Perfil Nuevo");
  assert.equal((await pedir("/users/me", { metodo: "PUT", token, cuerpo: { name: "X Y", email: "lucia@ejemplo.test" } })).status, 409);
  assert.equal((await pedir("/users/me/password", { metodo: "PUT", token, cuerpo: { actual: "mal", nueva: "Nueva1234" } })).status, 400);
  assert.equal((await pedir("/users/me/password", { metodo: "PUT", token, cuerpo: { actual: "Prueba123", nueva: "Nueva1234" } })).status, 204);
  assert.equal((await pedir("/auth/login", { metodo: "POST", cuerpo: { email, password: "Nueva1234" } })).status, 200);
});

test("demasiados intentos de login fallidos → 429", async () => {
  const email = emailNuevo("fuerza-bruta");
  let ultimo = 0;
  for (let i = 0; i < 11; i++) ultimo = (await pedir("/auth/login", { metodo: "POST", cuerpo: { email, password: "mal" } })).status;
  assert.equal(ultimo, 429);
});
