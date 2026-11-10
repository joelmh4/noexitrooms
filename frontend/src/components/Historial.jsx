// Historial de un ticket: mensajes y cambios de estado en orden cronológico
import { ESTADOS, fechaHora } from "../utils/formato";

export default function Historial({ ticket, verInternas, ultimoRecien = false }) {
  const elementos = [
    ...ticket.mensajes.filter(m => verInternas || !m.is_internal).map(m => ({ tipo: "mensaje", fecha: m.created_at, dato: m })),
    ...ticket.historial.map(h => ({ tipo: "evento", fecha: h.changed_at, dato: h }))
  ].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.tipo === "evento" ? 1 : -1));
  const ultimoMensaje = elementos.filter(e => e.tipo === "mensaje").pop();

  return (
    <div className="historial">
      {elementos.map(el => {
        const d = el.dato;
        if (el.tipo === "evento") {
          const texto = d.old_status
            ? `${d.autor.name} cambió el estado: ${ESTADOS[d.old_status]} → ${ESTADOS[d.new_status]}`
            : `${d.autor.name} abrió el ticket`;
          return <p key={`e${d.id}`} className="evento">{texto} · {fechaHora(d.changed_at)}</p>;
        }
        const delEquipo = d.autor.role !== "cliente";
        const clase = d.is_internal ? "mensaje interno" : delEquipo ? "mensaje del-equipo" : "mensaje";
        const rol = d.is_internal ? "Nota interna" : delEquipo ? "Equipo NoExitRooms" : "Cliente";
        return (
          <div key={`m${d.id}`} className={`${clase}${ultimoRecien && el === ultimoMensaje ? " recien" : ""}`}>
            <span className="autor">{d.autor.name} <small>{rol} · {fechaHora(d.created_at)}</small></span>
            {/* white-space: pre-line respeta los saltos de línea del mensaje */}
            <p style={{ whiteSpace: "pre-line" }}>{d.body}</p>
          </div>
        );
      })}
    </div>
  );
}
