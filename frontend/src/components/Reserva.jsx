// Reserva con calendario en la ficha de sala: semana a semana, huecos libres u ocupados, jugadores y confirmar
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Aviso, Cargando } from "./Piezas";
import { diaIso, precio } from "../utils/formato";

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const ETIQUETAS = { libre: "libre", ocupada: "ocupada", tuya: "reservada por ti", pasada: "ya ha pasado" };
const deIso = f => new Date(f + "T00:00:00");
const textoDia = f => { const d = deIso(f); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
const textoLargo = s => `${new Date(s).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a las ${s.slice(11, 16)}`;

export default function Reserva({ sala }) {
  const { usuario } = useAuth();
  const [semana, setSemana] = useState(0);
  const [dias, setDias] = useState(null);
  const [elegido, setElegido] = useState(null);
  const [jugadores, setJugadores] = useState(Math.min(sala.max_players, Math.max(sala.min_players, 4)));
  const [mensaje, setMensaje] = useState(null);   // { tipo, texto }
  const [enviando, setEnviando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const desde = new Date(hoy); desde.setDate(desde.getDate() + semana * 7);

  useEffect(() => {
    let vigente = true;
    setDias(null);
    api.reservas.huecos(sala.id, diaIso(desde), 7)
      .then(d => { if (vigente) setDias(d); })
      .catch(err => { if (vigente) setMensaje({ tipo: "error", texto: err.message }); });
    return () => { vigente = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala.id, semana, recarga]);

  function cambiarSemana(n) { setSemana(semana + n); setElegido(null); setMensaje(null); }

  async function reservar() {
    setEnviando(true);
    try {
      await api.reservas.crear({ room_id: sala.id, starts_at: elegido, players: jugadores });
      setMensaje({ tipo: "ok", texto: `Reserva hecha: ${textoLargo(elegido)}, ${jugadores} jugadores. Queda pendiente hasta que la confirmemos (la verás en Mis tickets).` });
      setElegido(null);
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
      if (err.status === 409) setElegido(null);
    }
    setEnviando(false);
    setRecarga(recarga + 1);
  }

  const hasta = dias ? deIso(dias[6].fecha) : null;
  return (
    <section className="reserva" id="reservar" aria-labelledby="titulo-reserva">
      <div className="reserva-cabecera">
        <div className="pila" style={{ gap: 6 }}>
          <span className="etiqueta-superior">Reserva online</span>
          <h2 id="titulo-reserva">Elegid día y hora</h2>
        </div>
        <div className="reserva-semana">
          <button type="button" className="boton boton-secundario boton-pequeno" disabled={semana === 0} aria-label="Semana anterior" onClick={() => cambiarSemana(-1)}><ChevronLeft /></button>
          <span aria-live="polite">{hasta && `${desde.getDate()} ${MESES[desde.getMonth()]} – ${hasta.getDate()} ${MESES[hasta.getMonth()]}`}</span>
          <button type="button" className="boton boton-secundario boton-pequeno" disabled={semana >= 7} aria-label="Semana siguiente" onClick={() => cambiarSemana(1)}><ChevronRight /></button>
        </div>
      </div>
      {!dias ? <Cargando texto="Cargando horarios…" /> : (
        <div className="calendario">
          {dias.map(d => (
            <div className="calendario-dia" key={d.fecha}>
              <p className="calendario-fecha">{textoDia(d.fecha)}</p>
              {d.horas.map(h => (
                <button key={h.starts_at} type="button" className={`hueco hueco-${h.estado}`} disabled={h.estado !== "libre"}
                  aria-pressed={elegido === h.starts_at} aria-label={`${textoDia(d.fecha)}, ${h.hora}: ${ETIQUETAS[h.estado]}`}
                  onClick={() => { setElegido(h.starts_at); setMensaje(null); }}>
                  {h.hora}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      <ul className="calendario-leyenda" aria-hidden="true">
        <li><span className="hueco-muestra hueco-libre"></span>Libre</li>
        <li><span className="hueco-muestra hueco-ocupada"></span>Ocupada</li>
        <li><span className="hueco-muestra hueco-tuya"></span>Tuya</li>
      </ul>
      <div className="reserva-resumen tarjeta">
        {!elegido ? <p className="texto-suave">Elegid un hueco libre en el calendario.</p> : (
          <>
            <div className="resumen-hueco"><span className="etiqueta-superior">Vuestra sesión</span><b>{textoLargo(elegido)}</b></div>
            <div className="resumen-jugadores" role="group" aria-label="Número de jugadores">
              <button type="button" className="boton boton-secundario boton-pequeno" disabled={jugadores <= sala.min_players} aria-label="Un jugador menos" onClick={() => setJugadores(jugadores - 1)}>−</button>
              <span><b>{jugadores}</b> jugadores</span>
              <button type="button" className="boton boton-secundario boton-pequeno" disabled={jugadores >= sala.max_players} aria-label="Un jugador más" onClick={() => setJugadores(jugadores + 1)}>+</button>
            </div>
            {!usuario ? <Link className="boton boton-primario" to={`/login?volver=${encodeURIComponent(`/salas/${sala.slug}`)}`}>Inicia sesión para reservar</Link>
              : usuario.role !== "cliente" ? <p className="texto-suave">Las reservas las hacen los clientes. Entra con una cuenta de cliente para probarlo.</p>
              : <button type="button" className="boton boton-primario" disabled={enviando} onClick={reservar}>Reservar por {precio(jugadores * sala.price_per_person)}</button>}
          </>
        )}
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
    </section>
  );
}
