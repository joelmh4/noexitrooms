// Ficha de sala (/salas/:slug): ambientación, galería con visor a pantalla completa y reserva con calendario
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Calendar, MessageSquare, X, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../api/api";
import { useDatos } from "../utils/useDatos";
import { AMBIENTES } from "../utils/ambientes";
import { Aviso, Cargando, Dificultad, Foto } from "../components/Piezas";
import Reserva from "../components/Reserva";
import { NIVELES, claseFondo, fotoSala, fotosGaleria, precio } from "../utils/formato";

export default function Sala() {
  const { slug } = useParams();
  const { datos: sala, error } = useDatos(() => api.salas.obtener(slug), [slug]);
  useEffect(() => { if (sala) document.title = `${sala.name} · NoExitRooms`; }, [sala]);

  if (error?.status === 404) return <Navigate to="/404" replace />;
  if (error) return <section className="seccion"><div className="contenedor"><Aviso tipo="error">{error.message}</Aviso></div></section>;
  if (!sala) return <section className="seccion"><div className="contenedor"><Cargando texto="Cargando sala…" /></div></section>;

  const esParodia = sala.description.includes("caricaturizados");
  // Las pruebas llegan en un solo texto, una por línea
  const pruebas = (sala.challenges || "").split("\n").map(p => p.trim()).filter(Boolean);
  const ambiente = AMBIENTES[sala.slug];

  return (
    <section className="seccion">
      <div className="contenedor">
        <nav className="migas" aria-label="Migas de pan"><Link to="/salas">Salas</Link> / {sala.name}</nav>
        <div className={`ficha-cabecera ${claseFondo(sala.theme)}`}><Foto className="foto-sala" src={fotoSala(sala)} alt="" /><span className="tema-tag">{sala.theme}</span></div>
        <div className="ficha">
          <div className="ficha-texto">
            <h1>{sala.name}</h1>
            <p className="lema">{sala.tagline}</p>
            <p>{sala.description}</p>
            {ambiente && (
              <aside className={`ambiente ${ambiente.clase}`} aria-label={ambiente.titulo}>
                <p className="ambiente-titulo"><span className="ambiente-piloto" aria-hidden="true"></span>{ambiente.titulo}</p>
                <div className="ambiente-pantalla">{ambiente.lineas.map(([texto, clase], i) => <div key={i} className={clase}>{texto}</div>)}</div>
              </aside>
            )}
            {pruebas.length > 0 && (
              <>
                <h2 style={{ fontSize: "1.3rem", marginTop: 16 }}>Lo que os espera</h2>
                <ul className="lista-pruebas">{pruebas.map(p => <li key={p}>{p}</li>)}</ul>
              </>
            )}
            <Galeria sala={sala} />
            {esParodia && <Aviso tipo="info">Sala de humor. Los personajes son caricaturas y la historia es ficticia.</Aviso>}
            {sala.min_age >= 18 && <Aviso tipo="aviso">Solo mayores de 18 años. Se pide el DNI en recepción.</Aviso>}
          </div>
          <aside className="tarjeta ficha-datos">
            <p className="tarjeta-titulo">Datos de la sala</p>
            <dl>
              <dt>Temática</dt><dd>{sala.theme}</dd>
              <dt>Dificultad</dt><dd><Dificultad nivel={sala.difficulty} /> {NIVELES[sala.difficulty]}</dd>
              <dt>Duración</dt><dd>{sala.duration_min} min</dd>
              <dt>Jugadores</dt><dd>{sala.min_players} a {sala.max_players}</dd>
              <dt>Edad mínima</dt><dd>{sala.min_age ? `${sala.min_age} años` : "Todas las edades"}</dd>
              <dt>Precio</dt><dd className="precio">{precio(sala.price_per_person)} / persona</dd>
            </dl>
            <a className="boton boton-primario boton-bloque" href="#reservar"><Calendar /> Reservar</a>
            <Link className="boton boton-secundario boton-bloque" to={`/nuevo-ticket?sala=${encodeURIComponent(sala.slug)}`}><MessageSquare /> Preguntar algo</Link>
          </aside>
        </div>
        <Reserva sala={sala} />
      </div>
    </section>
  );
}

/* ---------- Galería: al pulsar una foto se abre en un <dialog> a pantalla completa ---------- */
function Galeria({ sala }) {
  const [fotos, setFotos] = useState(() => fotosGaleria(sala));   // si una foto no existe, se quita de la lista
  const [actual, setActual] = useState(0);
  const visor = useRef(null);
  const inicioX = useRef(null);
  if (!fotos.length) return null;

  const mostrar = i => setActual((i + fotos.length) % fotos.length);
  const abrir = i => { mostrar(i); visor.current.showModal(); };

  return (
    <>
      <div className="galeria-sala">
        {fotos.map((src, i) => (
          <button key={src} type="button" className="galeria-foto" aria-label={`Ver la foto ${i + 1} a pantalla completa`} onClick={() => abrir(i)}>
            <img src={src} alt={`${sala.name}: foto ${i + 1} de la sala`} loading="lazy" onError={() => setFotos(fotos.filter(f => f !== src))} />
          </button>
        ))}
      </div>
      <dialog ref={visor} className="visor" aria-label={`Fotos de ${sala.name}`}
        onClick={e => { if (e.target === visor.current) visor.current.close(); }}
        onKeyDown={e => { if (e.key === "ArrowLeft") mostrar(actual - 1); if (e.key === "ArrowRight") mostrar(actual + 1); }}
        onPointerDown={e => { inicioX.current = e.clientX; }}
        onPointerUp={e => {
          // Deslizar con el dedo
          const d = e.clientX - (inicioX.current ?? e.clientX);
          if (Math.abs(d) > 50) mostrar(actual + (d < 0 ? 1 : -1));
          inicioX.current = null;
        }}>
        <img src={fotos[actual]} alt={`${sala.name}: foto ${actual + 1} de la sala`} />
        <p className="visor-pie">{actual + 1} / {fotos.length}</p>
        <button type="button" className="visor-boton visor-cerrar" aria-label="Cerrar" onClick={() => visor.current.close()}><X /></button>
        <button type="button" className="visor-boton visor-anterior" aria-label="Foto anterior" onClick={() => mostrar(actual - 1)}><ChevronLeft /></button>
        <button type="button" className="visor-boton visor-siguiente" aria-label="Foto siguiente" onClick={() => mostrar(actual + 1)}><ChevronRight /></button>
      </dialog>
    </>
  );
}
