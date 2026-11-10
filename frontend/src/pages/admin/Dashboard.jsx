// Dashboard del administrador: las métricas de GET /stats y los tickets sin asignar
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { useAvisos } from "../../context/Avisos";
import { useDatos } from "../../utils/useDatos";
import { Aviso, Cargando, ChipEstado, ChipPrioridad } from "../../components/Piezas";
import { ESTADOS, codigoTicket, diaIso, fechaHora, iniciales } from "../../utils/formato";

// Nombre de la variable CSS del color de cada estado
const colorEstado = e => `var(--estado-${e === "en_curso" ? "en-curso" : e === "pendiente_cliente" ? "pendiente" : e})`;

export default function Dashboard() {
  const { toast } = useAvisos();
  const { datos, error, recargar } = useDatos(() => Promise.all([api.estadisticas(), api.tickets.listar(), api.usuarios.agentes()]));
  if (error) return <Aviso tipo="error">{error.message}</Aviso>;
  const hoy = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
  const cabecera = (
    <div className="cabecera-pagina">
      <div className="pila" style={{ gap: 4 }}><p className="sobretitulo">{hoy}</p><h1 className="titulo-panel">Dashboard</h1></div>
      <Link className="boton boton-secundario" to="/admin/tickets">Ver todos los tickets</Link>
    </div>
  );
  if (!datos) return <>{cabecera}<Cargando texto="Cargando métricas…" /></>;

  const [stats, tickets, agentes] = datos;
  const t = stats.tickets;
  const horas = t.horas_medias_hasta_resolver;
  const monitores = [
    { titulo: "Activos", valor: t.activos, detalle: `de ${t.total} en total`, color: "var(--estado-abierto)", enlace: "/admin/tickets" },
    { titulo: "Sin asignar", valor: t.sin_asignar.total, detalle: t.sin_asignar.alta ? `${t.sin_asignar.alta} de prioridad alta` : "ninguno urgente",
      color: t.sin_asignar.alta ? "var(--prioridad-alta)" : "var(--estado-cerrado)", alerta: t.sin_asignar.alta > 0, enlace: "/admin/tickets?agente=ninguno" },
    { titulo: "Tiempo hasta resolver", valor: horas === null ? "—" : horas < 48 ? `${String(horas).replace(".", ",")} h` : `${Math.round(horas / 24)} d`,
      detalle: "media hasta el primer «resuelto»", color: "var(--estado-resuelto)" },
    { titulo: "Reservas por confirmar", valor: stats.reservas.pendientes_de_confirmar,
      detalle: `${stats.reservas.proximos_7_dias} ${stats.reservas.proximos_7_dias === 1 ? "partida" : "partidas"} en 7 días`, color: "var(--estado-en-curso)" }
  ];
  const estados = Object.entries(t.por_estado);
  const maxPrioridad = Math.max(1, ...Object.values(t.activos_por_prioridad));
  const maxCarga = Math.max(1, ...stats.agentes.map(a => a.activos));
  const maxCategoria = Math.max(1, ...t.por_categoria.map(c => c.n));
  // Últimos 7 días (los días sin tickets también salen, a 0)
  const porDia = Object.fromEntries(t.creados_ultimos_7_dias.map(d => [d.dia, d.n]));
  const dias = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return { n: porDia[diaIso(d)] || 0, letra: d.toLocaleDateString("es-ES", { weekday: "narrow" }), nombre: d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" }) };
  });
  const maxDia = Math.max(1, ...dias.map(d => d.n));
  const libres = tickets.filter(x => x.agent_id === null && x.status !== "cerrado")
    .sort((a, b) => ["alta", "media", "baja"].indexOf(a.priority) - ["alta", "media", "baja"].indexOf(b.priority));

  async function asignar(ticket, select) {
    if (!select.value) return;
    try {
      await api.tickets.asignar(ticket.id, Number(select.value));
      toast("ok", `${codigoTicket(ticket.id)} asignado a ${select.selectedOptions[0].text}.`);
    } catch (err) {
      toast("error", err.message);
    }
    recargar();
  }

  return (
    <>
      {cabecera}
      <div className="monitores">
        {monitores.map(m => {
          const dentro = <><span className="monitor-titulo"><span className="piloto" style={{ "--c": m.color }}></span>{m.titulo}</span><b>{m.valor}</b><small>{m.detalle}</small></>;
          return m.enlace
            ? <Link key={m.titulo} className={`monitor${m.alerta ? " monitor-alerta" : ""}`} to={m.enlace}>{dentro}</Link>
            : <div key={m.titulo} className="monitor">{dentro}</div>;
        })}
      </div>
      <div className="rejilla-panel">
        <section className="modulo modulo-ancho" aria-labelledby="t-cola">
          <h2 className="modulo-titulo" id="t-cola">Cola de tickets</h2>
          {t.total ? (
            <>
              <div className="barra-apilada" role="img" aria-label={estados.map(([e, n]) => `${ESTADOS[e]}: ${n}`).join(", ")}>
                {estados.filter(([, n]) => n).map(([e, n]) => <span key={e} style={{ flex: n, "--c": colorEstado(e) }} title={`${ESTADOS[e]}: ${n}`}></span>)}
              </div>
              <ul className="leyenda">
                {estados.map(([e, n]) => <li key={e}><Link to={`/admin/tickets?estado=${e}`}><ChipEstado estado={e} /><b>{n}</b></Link></li>)}
              </ul>
            </>
          ) : <p className="vacio">Todavía no hay tickets.</p>}
        </section>

        <section className="modulo" aria-labelledby="t-prioridad">
          <h2 className="modulo-titulo" id="t-prioridad">Activos por prioridad</h2>
          <div className="barras-lista">
            {["alta", "media", "baja"].map(p => (
              <div className="barra-fila" key={p}>
                <ChipPrioridad prioridad={p} />
                <span className="barra-pista"><span style={{ width: `${t.activos_por_prioridad[p] / maxPrioridad * 100}%`, "--c": `var(--prioridad-${p})` }}></span></span>
                <b>{t.activos_por_prioridad[p]}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="modulo modulo-ancho" aria-labelledby="t-libres">
          <div className="fila-entre"><h2 className="modulo-titulo" id="t-libres">Sin asignar</h2><span className="subtexto">Elige un agente y se le asigna al momento</span></div>
          {!libres.length ? <p className="vacio">No hay tickets sin asignar. ¡Bien!</p> : (
            <ul className="lista-libres">
              {libres.map(x => (
                <li className="ticket-libre" key={x.id}>
                  <span className="codigo-ticket">{codigoTicket(x.id)}</span>
                  <span className="ticket-libre-texto"><Link to={`/admin/tickets/${x.id}`}>{x.subject}</Link><span className="subtexto">{x.cliente.name} · {x.categoria} · {fechaHora(x.created_at)}</span></span>
                  <ChipPrioridad prioridad={x.priority} />
                  <span>
                    <label className="solo-lectores" htmlFor={`asignar-${x.id}`}>Asignar {codigoTicket(x.id)}</label>
                    <select id={`asignar-${x.id}`} className="boton boton-secundario boton-pequeno" defaultValue="" onChange={e => asignar(x, e.target)}>
                      <option value="">Asignar a…</option>
                      {agentes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="modulo" aria-labelledby="t-carga">
          <h2 className="modulo-titulo" id="t-carga">Carga de los agentes</h2>
          <div className="pila">
            {stats.agentes.length ? stats.agentes.map(a => (
              <div className="agente-carga" key={a.id ?? a.name}>
                <div className="fila-entre"><span className="fila" style={{ gap: 10 }}><span className="avatar">{iniciales(a.name)}</span><b>{a.name}</b></span><span className="subtexto">{a.resueltos} {a.resueltos === 1 ? "resuelto" : "resueltos"}</span></div>
                <span className="barra-pista" role="img" aria-label={`${a.activos} activos, ${a.pendientes_cliente} esperando al cliente`}>
                  <span style={{ width: `${(a.activos - a.pendientes_cliente) / maxCarga * 100}%`, "--c": "var(--estado-en-curso)" }}></span>
                  <span style={{ width: `${a.pendientes_cliente / maxCarga * 100}%`, "--c": "var(--estado-pendiente)" }}></span>
                </span>
                <span className="subtexto">{a.activos} {a.activos === 1 ? "activo" : "activos"}{a.pendientes_cliente > 0 && ` · ${a.pendientes_cliente} esperando al cliente`}</span>
              </div>
            )) : <p className="vacio">No hay agentes activos.</p>}
          </div>
        </section>

        <section className="modulo modulo-ancho" aria-labelledby="t-categorias">
          <h2 className="modulo-titulo" id="t-categorias">Tickets por categoría</h2>
          <div className="barras-lista">
            {t.por_categoria.map(c => (
              <div className="barra-fila barra-fila-texto" key={c.id}>
                <span>{c.name}</span>
                <span className="barra-pista"><span style={{ width: `${c.n / maxCategoria * 100}%`, "--c": "var(--color-neon)" }}></span></span>
                <b>{c.n}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="modulo" aria-labelledby="t-semana">
          <h2 className="modulo-titulo" id="t-semana">Creados esta semana</h2>
          <div className="columnas" role="img" aria-label={dias.map(d => `${d.nombre}: ${d.n}`).join(", ")}>
            {dias.map((d, i) => (
              <span key={d.nombre} className={`columna${i === 6 ? " hoy" : ""}`} title={`${d.nombre}: ${d.n}`}>
                <b>{d.n || ""}</b><i style={{ height: `${Math.max(4, d.n / maxDia * 100)}%` }}></i><small>{d.letra}</small>
              </span>
            ))}
          </div>
          <p className="subtexto">{dias.reduce((a, d) => a + d.n, 0)} tickets nuevos en los últimos 7 días</p>
        </section>
      </div>
    </>
  );
}
