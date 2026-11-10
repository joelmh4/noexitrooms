// Todos los tickets (admin) con buscador y filtros por cliente, agente, estado y prioridad
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/api";
import { useDatos } from "../../utils/useDatos";
import { Aviso, Cargando } from "../../components/Piezas";
import TablaTickets from "../../components/TablaTickets";
import { ESTADOS, PRIORIDADES, codigoTicket } from "../../utils/formato";

const unicos = lista => [...new Map(lista.map(p => [p.id, p])).values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
const VACIO = { buscar: "", cliente: "", agente: "", estado: "", prioridad: "" };

export default function AdminTickets() {
  const { datos: tickets, error } = useDatos(() => api.tickets.listar());
  const [params] = useSearchParams();
  // Desde el dashboard se llega con un filtro puesto (?estado=abierto, ?agente=ninguno…)
  const [f, setF] = useState(() => ({ ...VACIO, estado: params.get("estado") || "", prioridad: params.get("prioridad") || "", agente: params.get("agente") || "" }));
  const cambiar = e => setF({ ...f, [e.target.name]: e.target.value });

  if (error) return <Aviso tipo="error">{error.message}</Aviso>;
  if (!tickets) return <Cargando texto="Cargando tickets…" />;

  const texto = f.buscar.trim().toLowerCase();
  const visibles = tickets.filter(t =>
    (!texto || t.subject.toLowerCase().includes(texto) || codigoTicket(t.id).toLowerCase().includes(texto)) &&
    (!f.cliente || t.customer_id === Number(f.cliente)) &&
    (!f.agente || (f.agente === "ninguno" ? t.agent_id === null : t.agent_id === Number(f.agente))) &&
    (!f.estado || t.status === f.estado) &&
    (!f.prioridad || t.priority === f.prioridad));

  const selector = (nombre, etiqueta, opciones) => (
    <div className="campo" style={{ minWidth: 180 }}>
      <label className="solo-lectores" htmlFor={nombre}>{etiqueta}</label>
      <select id={nombre} name={nombre} value={f[nombre]} onChange={cambiar}>{opciones}</select>
    </div>
  );

  return (
    <>
      <div className="cabecera-pagina"><h1 style={{ fontSize: "2rem" }}>Todos los tickets</h1><span className="texto-suave" aria-live="polite">{visibles.length} de {tickets.length} tickets</span></div>
      <form className="fila" role="search" aria-label="Filtrar tickets" onSubmit={e => e.preventDefault()}>
        <div className="campo" style={{ flex: 1, minWidth: 200 }}>
          <label className="solo-lectores" htmlFor="buscar">Buscar</label>
          <input id="buscar" name="buscar" type="search" placeholder="Asunto o código NXR-0000" value={f.buscar} onChange={cambiar} />
        </div>
        {selector("cliente", "Cliente", <><option value="">Todos los clientes</option>{unicos(tickets.map(t => t.cliente)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</>)}
        {selector("agente", "Agente", <><option value="">Todos los agentes</option><option value="ninguno">Sin asignar</option>{unicos(tickets.filter(t => t.agente).map(t => t.agente)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</>)}
        {selector("estado", "Estado", <><option value="">Todos los estados</option>{Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</>)}
        {selector("prioridad", "Prioridad", <><option value="">Todas las prioridades</option>{Object.entries(PRIORIDADES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</>)}
        <button className="boton boton-secundario boton-pequeno" type="button" onClick={() => setF(VACIO)}>Limpiar</button>
      </form>
      <TablaTickets tickets={visibles} enlace="/admin/tickets" columnas={["codigo", "asunto", "cliente", "agente", "estado", "prioridad", "fecha"]} />
    </>
  );
}
