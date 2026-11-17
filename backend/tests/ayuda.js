// Arranca la API en un puerto libre para las pruebas y da funciones para hacer peticiones.
// Las pruebas usan la base de datos del .env con los datos de ejemplo (npm run carga antes de npm test).
const { before, after } = require("node:test");
process.env.NODE_ENV = "test";
const app = require("../app");
const { conectar, desconectar } = require("../config/db");

let servidor;
let base = "";
// Las peticiones esperan a que el servidor esté escuchando (por si un before() de una prueba se adelanta)
let marcarListo;
const listo = new Promise(r => { marcarListo = r; });

before(async () => {
    await conectar();
    servidor = app.listen(0);
    await new Promise(r => servidor.once("listening", r));
    base = `http://127.0.0.1:${servidor.address().port}/api`;
    marcarListo();
});
after(async () => { servidor.close(); await desconectar(); });

async function pedir(ruta, { metodo = "GET", cuerpo, token } = {}) {
    await listo;
    const res = await fetch(base + ruta, {
        method: metodo,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: cuerpo === undefined ? undefined : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)
    });
    const texto = await res.text();
    return { status: res.status, datos: texto ? JSON.parse(texto) : null };
}

async function entrar(email, password = "Demo1234!") {
    const r = await pedir("/auth/login", { metodo: "POST", cuerpo: { email, password } });
    if (r.status !== 200) throw new Error(`No se pudo entrar como ${email}: ${r.status}`);
    return r.datos.token;
}

// Email nuevo en cada ejecución, para no chocar con pruebas anteriores
const emailNuevo = nombre => `${nombre}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@prueba.test`;

module.exports = { pedir, entrar, emailNuevo };
