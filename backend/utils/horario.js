// Horarios de las salas. Todas las horas son "de reloj" en Madrid: AAAA-MM-DDTHH:MM:SS, sin zona.

// Pases de cada día. Las salas de más de 2 horas (San Tomás, 150 min) tienen menos.
const HORARIO = {
  normal: ["10:00", "12:00", "16:00", "18:00", "20:00", "22:00"],
  largo: ["10:00", "16:00", "19:30"]
};

const horasDe = sala => (sala.duration_min > 120 ? HORARIO.largo : HORARIO.normal);

// Fecha y hora actual en Madrid como "AAAA-MM-DDTHH:MM", para comparar con los pases
function ahoraEnMadrid(fecha = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(fecha).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// "2026-11-17" + 3 días → "2026-11-20"
function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

module.exports = { horasDe, ahoraEnMadrid, sumarDias };
