// Piezas pequeñas que se repiten en muchas páginas: chips de estado y prioridad,
// dificultad, avisos, campo de formulario, pantalla de carga y la tarjeta de sala.
// React escapa todo el texto que pintamos con {…}, así que no hace falta esc() como antes.
import { Link } from "react-router-dom";
import { Clock, Users } from "lucide-react";
import { ESTADOS, PRIORIDADES, NIVELES, claseFondo, fotoSala, precio, img } from "../utils/formato";

export function ChipEstado({ estado }) {
  return <span className={`estado estado-${estado}`}>{ESTADOS[estado] || estado}</span>;
}

export function ChipPrioridad({ prioridad }) {
  return (
    <span className={`prioridad prioridad-${prioridad}`}>
      <span className="barras" aria-hidden="true"><i></i><i></i><i></i></span>
      {PRIORIDADES[prioridad] || prioridad}
    </span>
  );
}

export function Dificultad({ nivel }) {
  return (
    <span className="dificultad" role="img" aria-label={`Dificultad ${nivel} de 5: ${NIVELES[nivel]}`}>
      {[1, 2, 3, 4, 5].map(i => <i key={i} className={i > nivel ? "off" : undefined}></i>)}
    </span>
  );
}

const ETIQUETAS_AVISO = { ok: "OK", error: "ERROR", aviso: "AVISO", info: "INFO" };
export function Aviso({ tipo, children }) {
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === "error" ? "alert" : "status"}>
      <b>{ETIQUETAS_AVISO[tipo]}</b><span>{children}</span>
    </div>
  );
}

// Un campo con su etiqueta. Si hay error, se marca en rojo y el texto de ayuda pasa a ser el error.
export function Campo({ id, etiqueta, error, ayuda, children, className = "", style, etiquetaOculta = false }) {
  return (
    <div className={`campo ${error ? "con-error" : ""} ${className}`} style={style}>
      <label htmlFor={id} className={etiquetaOculta ? "solo-lectores" : undefined}>{etiqueta}</label>
      {children}
      {(error || ayuda) && <span className="ayuda">{error || ayuda}</span>}
    </div>
  );
}

export function Cargando({ texto = "Cargando…" }) {
  return <p className="cargando" role="status"><img src={img("reloj-arena-oscuro.png")} alt="" />{texto}</p>;
}

// Una foto que se quita sola si no existe (queda el fondo de color de la temática)
export function Foto(props) {
  return <img {...props} onError={e => e.currentTarget.remove()} />;
}

export function TarjetaSala({ sala: s }) {
  return (
    <article className="tarjeta-sala">
      <div className={`imagen ${claseFondo(s.theme)}`}>
        <Foto className="foto-sala" src={fotoSala(s)} alt="" loading="lazy" />
        <span className="tema-tag">{s.theme}</span>
      </div>
      <div className="cuerpo">
        <h3>{s.name}</h3>
        <p className="lema">{s.tagline}</p>
        <div className="datos-sala">
          <Dificultad nivel={s.difficulty} />
          <span><Clock /> {s.duration_min} min</span>
          <span><Users /> {s.min_players}-{s.max_players}</span>
          {s.min_age > 0 && <span>+{s.min_age}</span>}
        </div>
        <div className="pie-tarjeta">
          <span className="precio">{precio(s.price_per_person)} <small className="texto-suave">/ persona</small></span>
          <Link className="boton boton-primario boton-pequeno" to={`/salas/${s.slug}`}>Ver sala</Link>
        </div>
      </div>
    </article>
  );
}
