// Gestión de un ticket (agente y admin): responder, notas internas, estado, prioridad y asignación (solo admin)
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useAvisos } from "../context/Avisos";
import { useDatos } from "../utils/useDatos";
import { Aviso, Campo, Cargando, ChipEstado, ChipPrioridad } from "../components/Piezas";
import Historial from "../components/Historial";
import { ESTADOS, PRIORIDADES, codigoTicket, fechaHora, iniciales } from "../utils/formato";

export default function GestionTicket() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { toast } = useAvisos();
  const esAdmin = usuario.role === "admin";
  const volver = esAdmin ? ["/admin/tickets", "Todos los tickets"] : ["/soporte", "Mis tickets"];
  const { datos: t, error, recargar } = useDatos(() => api.tickets.obtener(id), [id]);
  // Solo el admin asigna tickets, así que solo él necesita la lista de agentes
  const { datos: agentes } = useDatos(() => esAdmin ? api.usuarios.agentes() : Promise.resolve([]), [esAdmin]);
  const [respuesta, setRespuesta] = useState("");
  const [interna, setInterna] = useState(false);
  const [errorRespuesta, setErrorRespuesta] = useState("");
  const [recien, setRecien] = useState(false);

  useEffect(() => { if (t) document.title = `${codigoTicket(t.id)} · Soporte · NoExitRooms`; }, [t]);

  if (error) return <div className="pila"><Aviso tipo="error">{error.message}</Aviso><Link className="boton boton-secundario" to={volver[0]}>Volver</Link></div>;
  if (!t) return <Cargando texto="Cargando ticket…" />;

  // Cada cambio se guarda al momento y se recarga el ticket
  async function guardar(accion, mensaje) {
    try {
      await accion();
      toast("ok", mensaje);
    } catch (err) {
      toast("error", err.message);
    }
    recargar();
  }

  async function responder(e) {
    e.preventDefault();
    if (!respuesta.trim()) { setErrorRespuesta("Escribe un mensaje antes de enviar."); return; }
    setErrorRespuesta("");
    await guardar(() => api.tickets.responder(id, respuesta, interna), interna ? "Nota interna guardada." : "Respuesta enviada.");
    setRespuesta("");
    setInterna(false);
    setRecien(true);
  }

  // El agente no cierra tickets: lo hace el cliente al confirmar o un admin
  const estadosPermitidos = Object.entries(ESTADOS).filter(([v]) => esAdmin || v !== "cerrado" || t.status === "cerrado");

  return (
    <div className="pila">
      <Link to={volver[0]} className="subtexto">← {volver[1]}</Link>
      <div className="cabecera-pagina">
        <div className="pila" style={{ gap: 6 }}>
          <span className="codigo-ticket">{codigoTicket(t.id)} · {t.categoria}</span>
          <h1 style={{ fontSize: "1.8rem" }}>{t.subject}</h1>
        </div>
        <div className="fila"><ChipPrioridad prioridad={t.priority} /> <ChipEstado estado={t.status} /></div>
      </div>
      <div className="detalle">
        <div className="pila">
          <section className="tarjeta">
            <h2 className="tarjeta-titulo">Historial</h2>
            <Historial ticket={t} verInternas ultimoRecien={recien} />
          </section>
          {t.status !== "cerrado" && (
            <form className="tarjeta formulario" noValidate onSubmit={responder}>
              <Campo id="respuesta" etiqueta="Responder al cliente" error={errorRespuesta}>
                <textarea id="respuesta" maxLength={2000} placeholder="Escribe la respuesta…" value={respuesta} onChange={e => setRespuesta(e.target.value)} />
              </Campo>
              <div className="fila-entre">
                <label className="casilla"><input type="checkbox" checked={interna} onChange={e => setInterna(e.target.checked)} /> Nota interna (el cliente no la ve)</label>
                <button className="boton boton-primario" type="submit"><Send /> Enviar</button>
              </div>
            </form>
          )}
        </div>
        <aside className="pila">
          <section className="tarjeta">
            <h2 className="tarjeta-titulo">Cliente</h2>
            <div className="fila"><span className="avatar">{iniciales(t.cliente.name)}</span><strong>{t.cliente.name}</strong></div>
            <dl className="datos-ticket">
              {t.sala && <><dt>Sala</dt><dd>{t.sala.name}</dd></>}
              <dt>Creado</dt><dd>{fechaHora(t.created_at)}</dd>
              <dt>Actualizado</dt><dd>{fechaHora(t.updated_at)}</dd>
            </dl>
          </section>
          <section className="tarjeta formulario">
            <h2 className="tarjeta-titulo">Gestión</h2>
            {esAdmin ? (
              <Campo id="agente" etiqueta="Agente asignado">
                <select id="agente" value={t.agent_id ?? ""}
                  onChange={e => guardar(() => api.tickets.asignar(id, Number(e.target.value) || null), e.target.value ? "Ticket asignado." : "Ticket sin asignar.")}>
                  <option value="">Sin asignar</option>
                  {(agentes || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Campo>
            ) : (
              <dl className="datos-ticket"><dt>Agente</dt><dd>{t.agente?.name}</dd></dl>
            )}
            <Campo id="estado" etiqueta="Estado">
              <select id="estado" value={t.status}
                onChange={e => guardar(() => api.tickets.cambiarEstado(id, e.target.value), `Estado cambiado a ${ESTADOS[e.target.value]}.`)}>
                {estadosPermitidos.map(([v, txt]) => <option key={v} value={v}>{txt}</option>)}
              </select>
            </Campo>
            <Campo id="prioridad" etiqueta="Prioridad">
              <select id="prioridad" value={t.priority}
                onChange={e => guardar(() => api.tickets.cambiarPrioridad(id, e.target.value), `Prioridad cambiada a ${PRIORIDADES[e.target.value]}.`)}>
                {Object.entries(PRIORIDADES).map(([v, txt]) => <option key={v} value={v}>{txt}</option>)}
              </select>
            </Campo>
          </section>
        </aside>
      </div>
    </div>
  );
}
