// Panel del agente: los tickets que tiene asignados (la API no le devuelve otros)
import { useState } from "react";
import { api } from "../api/api";
import { useDatos } from "../utils/useDatos";
import { Aviso, Cargando } from "../components/Piezas";
import TablaTickets from "../components/TablaTickets";
import { ESTADOS, PRIORIDADES } from "../utils/formato";

export default function Soporte() {
  const { datos: mios, error } = useDatos(() => api.tickets.listar());
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  if (error) return <Aviso tipo="error">{error.message}</Aviso>;
  if (!mios) return <Cargando texto="Cargando tickets…" />;

  const metricas = [
    ["Mis abiertos", mios.filter(t => !["resuelto", "cerrado"].includes(t.status)).length, "var(--estado-abierto)"],
    ["Esperando al cliente", mios.filter(t => t.status === "pendiente_cliente").length, "var(--estado-pendiente)"],
    ["Prioridad alta", mios.filter(t => t.priority === "alta" && t.status !== "cerrado").length, "var(--prioridad-alta)"],
    ["Resueltos", mios.filter(t => t.status === "resuelto").length, "var(--estado-resuelto)"]
  ];
  const visibles = mios.filter(t => (!estado || t.status === estado) && (!prioridad || t.priority === prioridad));

  return (
    <>
      <div className="cabecera-pagina"><h1 style={{ fontSize: "2rem" }}>Mis tickets</h1></div>
      <div className="metricas">
        {metricas.map(([texto, n, color]) => <div key={texto} className="metrica" style={{ "--punto": color }}><span>{texto}</span><b>{n}</b></div>)}
      </div>
      <div className="fila-entre">
        <p className="subtexto">Los tickets que te ha asignado el administrador.</p>
        <form className="fila" onSubmit={e => e.preventDefault()}>
          <div className="campo" style={{ minWidth: 180 }}>
            <label className="solo-lectores" htmlFor="estado">Estado</label>
            <select id="estado" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
          <div className="campo" style={{ minWidth: 180 }}>
            <label className="solo-lectores" htmlFor="prioridad">Prioridad</label>
            <select id="prioridad" value={prioridad} onChange={e => setPrioridad(e.target.value)}>
              <option value="">Todas las prioridades</option>
              {Object.entries(PRIORIDADES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
        </form>
      </div>
      <TablaTickets tickets={visibles} enlace="/soporte/tickets" columnas={["codigo", "asunto", "cliente", "estado", "prioridad", "fecha"]} />
    </>
  );
}
