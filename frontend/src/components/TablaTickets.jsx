// Tabla de tickets (cliente, soporte y admin). Toda la fila es clicable; el enlace del asunto sirve con teclado.
// data-etiqueta: en el móvil cada fila se ve como una tarjeta y la celda enseña el nombre de su columna (css/panel.css)
import { Link, useNavigate } from "react-router-dom";
import { ChipEstado, ChipPrioridad } from "./Piezas";
import { codigoTicket, fechaHora } from "../utils/formato";

const CABECERAS = {
  codigo: "Código", asunto: "Asunto", cliente: "Cliente", agente: "Agente", categoria: "Categoría",
  estado: "Estado", prioridad: "Prioridad", fecha: "Actualizado"
};

function Celda({ columna, ticket: t, enlace }) {
  const props = { "data-etiqueta": CABECERAS[columna] };
  switch (columna) {
    case "codigo": return <td {...props} className="codigo-ticket">{codigoTicket(t.id)}</td>;
    case "asunto": return <td {...props} className="celda-principal"><Link to={`${enlace}/${t.id}`}>{t.subject}</Link><div className="subtexto">{t.categoria}</div></td>;
    case "cliente": return <td {...props}>{t.cliente.name}</td>;
    case "agente": return <td {...props}>{t.agente ? t.agente.name : <span className="subtexto">Sin asignar</span>}</td>;
    case "categoria": return <td {...props}>{t.categoria}</td>;
    case "estado": return <td {...props}><ChipEstado estado={t.status} /></td>;
    case "prioridad": return <td {...props}><ChipPrioridad prioridad={t.priority} /></td>;
    default: return <td {...props} className="subtexto">{fechaHora(t.updated_at)}</td>;
  }
}

export default function TablaTickets({ tickets, enlace, columnas }) {
  const navegar = useNavigate();
  if (!tickets.length) return <div className="tabla-envoltorio"><p className="vacio">No hay tickets que coincidan.</p></div>;
  return (
    <div className="tabla-envoltorio">
      <table>
        <thead><tr>{columnas.map(c => <th scope="col" key={c}>{CABECERAS[c]}</th>)}</tr></thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t.id} className="clicable" onClick={e => { if (!e.target.closest("a, button, select, input")) navegar(`${enlace}/${t.id}`); }}>
              {columnas.map(c => <Celda key={c} columna={c} ticket={t} enlace={enlace} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
