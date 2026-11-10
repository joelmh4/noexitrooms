// Detalle de ticket (cliente). El backend solo le devuelve sus tickets y nunca las notas internas.
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Send } from "lucide-react";
import { api } from "../api/api";
import { useAvisos } from "../context/Avisos";
import { useDatos } from "../utils/useDatos";
import { Aviso, Campo, Cargando, ChipEstado, ChipPrioridad } from "../components/Piezas";
import Historial from "../components/Historial";
import { codigoTicket, fechaHora } from "../utils/formato";

export default function TicketCliente() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { toast, confirmar } = useAvisos();
  const { datos: t, error, recargar } = useDatos(() => api.tickets.obtener(id), [id]);
  const [respuesta, setRespuesta] = useState("");
  const [errorRespuesta, setErrorRespuesta] = useState("");
  const [recien, setRecien] = useState(false);

  useEffect(() => {
    if (params.get("nuevo")) toast("ok", "Ticket creado. Te responderemos lo antes posible.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (t) document.title = `${codigoTicket(t.id)} · NoExitRooms`; }, [t]);

  if (error) return <div className="pila"><Aviso tipo="error">{error.message}</Aviso><Link className="boton boton-secundario" to="/mis-tickets">Volver a mis tickets</Link></div>;
  if (!t) return <Cargando texto="Cargando ticket…" />;

  async function responder(e) {
    e.preventDefault();
    if (!respuesta.trim()) { setErrorRespuesta("Escribe un mensaje antes de enviar."); return; }
    setErrorRespuesta("");
    try {
      await api.tickets.responder(id, respuesta);
      setRespuesta("");
      setRecien(true);
      toast("ok", "Mensaje enviado.");
      recargar();
    } catch (err) {
      toast("error", err.message);
    }
  }

  // Ticket resuelto: el cliente confirma el cierre o pide que se reabra
  async function cambiarEstado(nuevo) {
    const ok = nuevo === "cerrado"
      ? await confirmar({ titulo: "Cerrar el ticket", texto: "Si lo cierras ya no podrás escribir en él.", boton: "Cerrar ticket" })
      : await confirmar({ titulo: "Reabrir el ticket", texto: "El equipo volverá a revisarlo. Cuéntanos qué falta en un mensaje.", boton: "Reabrir" });
    if (!ok) return;
    try {
      await api.tickets.cambiarEstado(id, nuevo);
      toast("ok", nuevo === "cerrado" ? "Ticket cerrado. ¡Gracias!" : "Ticket reabierto.");
    } catch (err) {
      toast("error", err.message);
    }
    recargar();
  }

  return (
    <div className="pila">
      <Link to="/mis-tickets" className="subtexto">← Mis tickets</Link>
      <div className="cabecera-pagina">
        <div className="pila" style={{ gap: 6 }}>
          <span className="codigo-ticket">{codigoTicket(t.id)}</span>
          <h1 style={{ fontSize: "1.8rem" }}>{t.subject}</h1>
        </div>
        <ChipEstado estado={t.status} />
      </div>
      {t.status === "pendiente_cliente" && <Aviso tipo="aviso">El equipo está esperando tu respuesta para seguir.</Aviso>}
      <div className="detalle">
        <div className="pila">
          <section className="tarjeta">
            <h2 className="tarjeta-titulo">Conversación</h2>
            <Historial ticket={t} verInternas={false} ultimoRecien={recien} />
          </section>
          {t.status !== "cerrado" ? (
            <form className="tarjeta formulario" noValidate onSubmit={responder}>
              <Campo id="respuesta" etiqueta="Responder" error={errorRespuesta}>
                <textarea id="respuesta" maxLength={2000} placeholder="Escribe tu mensaje…" value={respuesta} onChange={e => setRespuesta(e.target.value)} />
              </Campo>
              <div className="fila" style={{ justifyContent: "flex-end" }}><button className="boton boton-primario" type="submit"><Send /> Enviar</button></div>
            </form>
          ) : <Aviso tipo="info">Este ticket está cerrado. Si necesitas algo más, abre un ticket nuevo.</Aviso>}
        </div>
        <aside className="tarjeta">
          <h2 className="tarjeta-titulo">Datos del ticket</h2>
          <dl className="datos-ticket">
            <dt>Estado</dt><dd><ChipEstado estado={t.status} /></dd>
            <dt>Prioridad</dt><dd><ChipPrioridad prioridad={t.priority} /></dd>
            <dt>Categoría</dt><dd>{t.categoria}</dd>
            {t.sala && <><dt>Sala</dt><dd><Link to={`/salas/${t.sala.slug}`}>{t.sala.name}</Link></dd></>}
            <dt>Atendido por</dt><dd>{t.agente ? t.agente.name : "Pendiente de asignar"}</dd>
            <dt>Creado</dt><dd>{fechaHora(t.created_at)}</dd>
            <dt>Actualizado</dt><dd>{fechaHora(t.updated_at)}</dd>
          </dl>
          {t.status === "resuelto" && (
            <>
              <Aviso tipo="info">El equipo ha marcado el ticket como resuelto. ¿Está todo bien?</Aviso>
              <button className="boton boton-primario boton-bloque" onClick={() => cambiarEstado("cerrado")}>Sí, cerrar el ticket</button>
              <button className="boton boton-secundario boton-bloque" onClick={() => cambiarEstado("abierto")}>No, sigue sin resolver</button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
