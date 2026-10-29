// Lee la configuración de las variables de entorno (.env en local, panel del servicio en producción).
// Si falta una obligatoria, el servidor no arranca: mejor fallar al inicio que a mitad de una petición.
import "dotenv/config";

function obligatoria(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} (mira .env.example)`);
  return valor;
}

export const entorno = {
  puerto: Number(process.env.PORT ?? 3000),
  produccion: process.env.NODE_ENV === "production",
  db: {
    host: obligatoria("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: obligatoria("DB_USER"),
    password: process.env.DB_PASSWORD ?? "",
    database: obligatoria("DB_NAME"),
    ssl: process.env.DB_SSL === "true"
  },
  jwt: {
    secreto: obligatoria("JWT_SECRET"),
    caduca: process.env.JWT_EXPIRES ?? "8h"
  },
  // Orígenes del frontend que pueden llamar a la API
  corsOrigenes: (process.env.CORS_ORIGIN ?? "").split(",").map(o => o.trim()).filter(Boolean)
} as const;
