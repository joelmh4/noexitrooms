// Carga sql/esquema.sql (tablas + datos de ejemplo) en la base de datos del .env.
// Uso: npm run db:cargar   ·   OJO: borra y vuelve a crear todas las tablas.
require("dotenv/config");
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "sql", "esquema.sql"), "utf8");
  const con = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true"
      ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA?.replace(/\\n/g, "\n") || undefined }
      : undefined,
    multipleStatements: true
  });
  await con.query(sql);
  const [[{ total }]] = await con.query("SELECT COUNT(*) AS total FROM users");
  console.log(`Esquema cargado en ${process.env.DB_NAME}: ${total} usuarios de prueba.`);
  await con.end();
})().catch(err => { console.error("No se pudo cargar el esquema:", err.message); process.exit(1); });
