// Mis tickets (cliente): próximas reservas y listado de tickets con filtro por estado
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useAvisos } from "../context/Avisos";
import { useDatos } from "../utils/useDatos";
import { Aviso, Cargando } from "../components/Piezas";
import TablaTickets from "../components/TablaTickets";
import { ESTADOS } from "../utils/formato";

export default function MisTickets() {
  const { usuario } = useAuth();
  const { toast } = useAvisos();
  const [params] = useSearchParams();
  const [filtro, setFiltro] = useState("todos");
  const { datos, error } = useDatos(() => Promise.all([api.tickets.listar(), api.reservas.mias()]));

  useEffect(() => {
    if (params.get("bienvenida")) toast("ok", `Cuenta creada. ¡Bienvenido/a, ${usuario.name.split(" ")[0]}!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <Aviso tipo="error">{error.message}</Aviso>;
  const [tickets, reservas] = datos || [[], []];
  const pendientes = tickets.filter(t => t.status === "pendiente_cliente").length;
  const visibles = filtro === "todos" ? tickets : tickets.filter(t => t.status === filtro);

  return (
    <>
      <div className="cabecera-pagina">
        <h1 style={{ fontSize: "2rem" }}>Mis tickets</h1>
        <Link className="boton boton-primario" to="/nuevo-ticket"><Plus /> Nuevo ticket</Link>
      </div>
      {!datos ? <Cargando texto="Cargando tickets…" /> : (
        <>
          {pendientes > 0 && <Aviso tipo="aviso">{pendientes === 1 ? "Tienes 1 ticket esperando tu respuesta." : `Tienes ${pendientes} tickets esperando tu respuesta.`}</Aviso>}
          <ProximasReservas reservas={reservas} />
          <div className="filtros-estado" role="group" aria-label="Filtrar por estado">
            {[["todos", "Todos"], ...Object.entries(ESTADOS)].map(([valor, texto]) => (
              <button key={valor} className="boton boton-secundario boton-pequeno" type="button" aria-pressed={valor === filtro} onClick={() => setFiltro(valor)}>
                {texto} ({valor === "todos" ? tickets.length : tickets.filter(t => t.status === valor).length})
              </button>
            ))}
          </div>
          {tickets.length
            ? <TablaTickets tickets={visibles} enlace="/tickets" columnas={["codigo", "asunto", "estado", "prioridad", "fecha"]} />
            : <div className="tarjeta vacio">Todavía no has abierto ningún ticket. <Link to="/nuevo-ticket">Abre el primero</Link>.</div>}
        </>
      )}
    </>
  );
}

// Próximas reservas del cliente (las pasadas y las canceladas no se enseñan)
function ProximasReservas({ reservas }) {
  const d = new Date();
  const ahora = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const proximas = reservas.filter(r => r.starts_at.slice(0, 16) >= ahora && r.status !== "cancelada").reverse();
  if (!proximas.length) return null;
  return (
    <section className="mis-reservas" aria-label="Tus reservas">
      <h2 className="tarjeta-titulo">Tus próximas reservas</h2>
      <div className="lista-reservas">
        {proximas.map(r => (
          <Link key={r.id} className="tarjeta reserva-mini" to={`/salas/${r.sala.slug}`}>
            <b>{r.sala.name}</b>
            <span>{new Date(r.starts_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {r.starts_at.slice(11, 16)} · {r.players} jugadores</span>
            <span className={`pastilla ${r.status === "confirmada" ? "pastilla-activa" : "pastilla-inactiva"}`}>{r.status === "confirmada" ? "Confirmada" : "Pendiente de confirmar"}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
