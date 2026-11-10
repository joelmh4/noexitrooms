// Inicio: foco de luz en la portada, salas destacadas, medidor "¿Cuánto aguantáis?", normas y bonos
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import { useDatos } from "../utils/useDatos";
import { Aviso, Cargando, TarjetaSala } from "../components/Piezas";
import { fotoSala, img } from "../utils/formato";

const PASOS = [
  ["candado.png", "1. Elige sala", "Filtra por temática, dificultad y número de jugadores."],
  ["grupo.png", "2. Reúne al grupo", "De 2 a 7 personas según la sala. Cuantos más cerebros, mejor."],
  ["calendario.png", "3. Reserva", "Elige día y hora y te lo confirmamos por ticket desde tu área."],
  ["idea.png", "4. Resuelve", "Enigmas, candados y pistas escondidas que cuentan la historia."],
  ["reloj.png", "5. Contra el reloj", "60 minutos (o 150 en San Tomás). El reloj no espera a nadie."],
  ["salida.png", "6. Escapa", "Abrid la última puerta y salid a por la foto de grupo."]
];
const NORMAS = [
  "Llegad 15 minutos antes. La puerta se cierra a la hora en punto.",
  "Los móviles se quedan en la taquilla. Aquí dentro no hay cobertura (ni la busquéis).",
  "Nada se fuerza. Si tenéis que romper algo, no es la solución.",
  "Tenéis tres pistas. La cuarta tiene un precio.",
  "San Tomás solo para mayores de 18. Lo decimos en serio.",
  "La salida de emergencia siempre está abierta. Siempre. Aunque no lo parezca."
];

// La portada está a oscuras y el ratón ilumina un círculo. El círculo es un degradado de CSS
// (.portada::after en css/inicio.css): aquí solo le decimos dónde está el ratón con dos variables.
function moverFoco(e) {
  const caja = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--foco-x", `${e.clientX - caja.left}px`);
  e.currentTarget.style.setProperty("--foco-y", `${e.clientY - caja.top}px`);
}

export default function Inicio() {
  const { datos: salas, error } = useDatos(() => api.salas.listar());
  return (
    <>
      <section className="portada" onMouseMove={moverFoco}>
        <div className="contenedor">
          <div className="portada-texto">
            <span className="etiqueta-superior">Escape rooms en Madrid</span>
            <h1>No hay salida.<br />Hasta que la encuentras.</h1>
            <p>Seis salas, sesenta minutos (o ciento cincuenta, si os atrevéis con San Tomás) y un equipo que sale por la puerta o se queda dentro para siempre.</p>
            <div className="fila">
              <Link className="boton boton-primario" to="/salas">Ver las salas</Link>
              <Link className="boton boton-secundario" to="/ayuda">¿Cómo funciona?</Link>
            </div>
            <p className="bono-portada">Primera visita: un 10 % menos con el código <Link to="/nuevo-ticket?bono=NOEXIT-1974"><code>NOEXIT-1974</code></Link></p>
          </div>
        </div>
      </section>

      <section className="manifiesto manifiesto-estatico" aria-label="Qué pasa cuando se cierra la puerta">
        <div className="manifiesto-fondo" aria-hidden="true"><img src={img("portada.webp")} alt="" loading="lazy" /></div>
        <div className="contenedor">
          <p className="manifiesto-texto">Se cierra la puerta. Se apaga la luz. Alguien estuvo aquí antes que vosotros y dejó las pistas a medias. Tenéis sesenta minutos para terminar lo que él no pudo.</p>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          <div className="fila-entre">
            <div className="pila" style={{ gap: 8 }}><span className="etiqueta-superior">Salas destacadas</span><h2>Elegid vuestra pesadilla</h2></div>
            <Link to="/salas">Ver todas las salas →</Link>
          </div>
          <div className="rejilla-salas tres">
            {error ? <Aviso tipo="error">{error.message}</Aviso>
              : !salas ? <Cargando texto="Cargando salas…" />
              : salas.slice(0, 3).map(s => <TarjetaSala key={s.id} sala={s} />)}
          </div>
        </div>
      </section>

      {salas?.length > 0 && <Medidor salas={salas} />}

      <section className="seccion">
        <div className="contenedor">
          <div className="pila" style={{ gap: 8 }}><span className="etiqueta-superior">Cómo funciona</span><h2>Seis pasos para escapar</h2></div>
          <div className="pasos pasos-seis">
            {PASOS.map(([icono, titulo, texto]) => (
              <div className="paso" key={titulo}><img src={img(`iconos/${icono}`)} alt="" /><h3>{titulo}</h3><p>{texto}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="seccion normas-seccion" aria-labelledby="titulo-normas">
        <div className="contenedor">
          <div className="normas-rejilla">
            <div className="pila" style={{ gap: 12 }}>
              <span className="etiqueta-superior">Antes de entrar</span>
              <h2 id="titulo-normas">Normas de la casa</h2>
              <p className="texto-suave">Las encontraréis clavadas en la puerta de cada sala. Leedlas: alguna os sacará de un apuro.</p>
            </div>
            <div className="aviso-papel">
              <span className="chincheta" aria-hidden="true"></span>
              <h3>AVISO A LOS JUGADORES</h3>
              <ol>{NORMAS.map(n => <li key={n}>{n}</li>)}</ol>
              <p className="firma">— La dirección</p>
            </div>
          </div>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          <Link className="regalo" to="/nuevo-ticket?regalo=1">
            <img src={img("salida-grupo.webp")} alt="" loading="lazy" />
            <span className="regalo-texto">
              <span className="etiqueta-superior">Bonos regalo</span>
              <span className="regalo-titulo">Regalad sesenta minutos de miedo</span>
              <span className="texto-suave">Para cualquier sala, válido un año. Pedidlo con un ticket y os lo preparamos.</span>
              <span className="boton boton-primario">Pedir un bono</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          <div className="tarjeta fila-entre" style={{ padding: 32 }}>
            <div className="pila" style={{ gap: 8 }}><h2>¿Grupo grande, cumpleaños o empresa?</h2><p className="texto-suave">Cuéntanos qué buscáis y os preparamos un plan a medida.</p></div>
            <Link className="boton boton-primario" to="/nuevo-ticket">Abrir un ticket</Link>
          </div>
        </div>
      </section>
    </>
  );
}

// Medidor "¿Cuánto aguantáis?": una palanca de 1 a 5 que recomienda la sala con la dificultad más parecida
const NOMBRES_NIVEL = ["Nada", "Un poco", "Lo justo", "Mucho", "Sin límite"];
function Medidor({ salas }) {
  const [nivel, setNivel] = useState(3);
  // La sala con la dificultad más cercana (si empatan, la de más dificultad)
  const sala = [...salas].sort((a, b) =>
    Math.abs(a.difficulty - nivel) - Math.abs(b.difficulty - nivel) || b.difficulty - a.difficulty)[0];
  return (
    <section className="seccion medidor" aria-labelledby="titulo-miedo">
      <div className="contenedor">
        <div className="medidor-rejilla">
          <div className="medidor-control">
            <span className="etiqueta-superior">Antes de reservar</span>
            <h2 id="titulo-miedo">¿Cuánto aguantáis?</h2>
            <p className="texto-suave">Mueve la palanca y te decimos qué puerta abrir.</p>
            <label className="medidor-palanca" htmlFor="nivel-miedo">
              <span className="solo-lectores">Nivel de dificultad que buscáis</span>
              <input type="range" id="nivel-miedo" min="1" max="5" step="1" value={nivel}
                aria-valuetext={NOMBRES_NIVEL[nivel - 1]} style={{ "--relleno": `${(nivel - 1) * 25}%` }}
                onChange={e => setNivel(Number(e.target.value))} />
            </label>
            <ol className="medidor-marcas" aria-hidden="true">{NOMBRES_NIVEL.map(n => <li key={n}>{n}</li>)}</ol>
          </div>
          {/* key: al cambiar de sala el enlace se vuelve a crear y se repite la animación de parpadeo */}
          <Link key={sala.id} className="medidor-sala cambiando" data-nivel={nivel} to={`/salas/${sala.slug}`} aria-live="polite">
            <span className="medidor-foto"><img alt="" src={fotoSala(sala)} /></span>
            <span className="medidor-info">
              <span className="etiqueta-superior">{sala.theme} · {sala.duration_min} min{sala.min_age > 0 && ` · +${sala.min_age}`}</span>
              <span className="medidor-nombre">{sala.name}</span>
              <span className="medidor-lema">{sala.tagline}</span>
              <span className="medidor-ir">Abrir esta puerta →</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
