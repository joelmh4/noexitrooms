// Conexión a MySQL con un pool de conexiones. Todas las consultas van parametrizadas (los ? de mysql2):
// los valores nunca se pegan dentro del texto SQL, así no hay inyección SQL.
import mysql, { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { entorno } from "../config/entorno";

export const pool = mysql.createPool({
  host: entorno.db.host,
  port: entorno.db.port,
  user: entorno.db.user,
  password: entorno.db.password,
  database: entorno.db.database,
  ssl: entorno.db.ssl ? { rejectUnauthorized: true } : undefined,
  connectionLimit: 10,
  // Las fechas se tratan en UTC y se devuelven como texto ISO
  timezone: "Z",
  dateStrings: false
});

// Que la base de datos también trabaje en UTC (CURRENT_TIMESTAMP, NOW()), sea cual sea la zona del servidor
pool.on("connection", con => { con.query("SET time_zone = '+00:00'"); });

type Valor = string | number | boolean | Date | null;

// SELECT: devuelve las filas ya tipadas
export async function consultar<T>(sql: string, valores: Valor[] = []): Promise<T[]> {
  const [filas] = await pool.execute<RowDataPacket[]>(sql, valores);
  return filas as T[];
}

// INSERT / UPDATE / DELETE: devuelve el id insertado y las filas afectadas
export async function ejecutar(sql: string, valores: Valor[] = []): Promise<ResultSetHeader> {
  const [resultado] = await pool.execute<ResultSetHeader>(sql, valores);
  return resultado;
}

// Varias operaciones que van juntas o no va ninguna (por ejemplo, cambiar el estado de un ticket y guardar su historial)
export async function enTransaccion<T>(trabajo: (con: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const con = await pool.getConnection();
  try {
    await con.beginTransaction();
    const resultado = await trabajo(con);
    await con.commit();
    return resultado;
  } catch (err) {
    await con.rollback();
    throw err;
  } finally {
    con.release();
  }
}
