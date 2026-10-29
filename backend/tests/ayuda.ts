// Arranca la API en un puerto libre para las pruebas y da una función para hacer peticiones
import { before, after } from "node:test";
import type { Server } from "node:http";
import { app } from "../src/app";
import { pool } from "../src/db/conexion";

let servidor: Server;
let base = "";

before(async () => {
  servidor = app.listen(0);
  await new Promise(r => servidor.once("listening", r));
  const dir = servidor.address();
  base = `http://127.0.0.1:${typeof dir === "object" && dir ? dir.port : 0}/api`;
});
after(async () => { servidor.close(); await pool.end(); });

export async function pedir(ruta: string, { metodo = "GET", cuerpo, token }: { metodo?: string; cuerpo?: unknown; token?: string } = {}) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo === undefined ? undefined : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)
  });
  const texto = await res.text();
  return { status: res.status, datos: texto ? JSON.parse(texto) : null };
}

export async function entrar(email: string, password = "Demo1234!") {
  const r = await pedir("/auth/login", { metodo: "POST", cuerpo: { email, password } });
  if (r.status !== 200) throw new Error(`No se pudo entrar como ${email}: ${r.status}`);
  return r.datos.token as string;
}

// Email nuevo en cada ejecución, para no chocar con pruebas anteriores
export const emailNuevo = (nombre: string) => `${nombre}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@prueba.test`;
