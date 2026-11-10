// Catálogo: buscador, filtros por temática, dificultad y jugadores, y orden
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import { useDatos } from "../utils/useDatos";
import { Aviso, Cargando, TarjetaSala } from "../components/Piezas";
import { NIVELES, img } from "../utils/formato";

const SIN_FILTROS = { buscar: "", temas: [], dificultad: "", jugadores: "", orden: "nombre" };
const COMPARAR = {
  nombre: (a, b) => a.name.localeCompare(b.name, "es"),
  precio: (a, b) => a.price_per_person - b.price_per_person,
  dificultad: (a, b) => a.difficulty - b.difficulty
};

export default function Salas() {
  const { datos: salas, error } = useDatos(() => api.salas.listar());
  const [params] = useSearchParams();
  // Si llegamos con ?tema=Humor, sale marcado
  const [f, setF] = useState(() => ({ ...SIN_FILTROS, temas: params.get("tema") ? [params.get("tema")] : [] }));
  const cambiar = (campo, valor) => setF({ ...f, [campo]: valor });
  const alternarTema = t => cambiar("temas", f.temas.includes(t) ? f.temas.filter(x => x !== t) : [...f.temas, t]);

  let lista = [];
  if (salas) {
    const texto = f.buscar.trim().toLowerCase();
    lista = salas.filter(s =>
      (!texto || s.name.toLowerCase().includes(texto) || s.tagline.toLowerCase().includes(texto)) &&
      (!f.temas.length || f.temas.includes(s.theme)) &&
      (!f.dificultad || s.difficulty === Number(f.dificultad)) &&
      (!f.jugadores || (Number(f.jugadores) >= s.min_players && Number(f.jugadores) <= s.max_players))
    ).sort(COMPARAR[f.orden]);
  }
  // Solo ofrecemos las temáticas que tienen salas
  const tematicas = salas ? [...new Set(salas.map(s => s.theme))] : [];

  return (
    <section className="seccion">
      <div className="contenedor">
        <div className="pila" style={{ gap: 8 }}><span className="etiqueta-superior">Catálogo</span><h1>Elegid qué puerta abrir</h1><p className="texto-suave">Detrás de cada puerta hay una historia y sesenta minutos (o alguno más). Filtrad por temática, dificultad o número de jugadores.</p></div>
        <div className="foto-banda foto-banda-fina" aria-hidden="true"><img src={img("salas-cabecera.webp")} alt="" loading="lazy" width="2400" height="1340" /></div>
        <div className="catalogo">
          <form className="filtros tarjeta" role="search" aria-label="Filtrar salas" onSubmit={e => e.preventDefault()}>
            <div className="campo">
              <label htmlFor="buscar">Buscar</label>
              <input id="buscar" type="search" placeholder="Nombre de la sala" value={f.buscar} onChange={e => cambiar("buscar", e.target.value)} />
            </div>
            <fieldset><legend>Temática</legend>
              <div className="pila" style={{ gap: 8 }}>
                {tematicas.map(t => (
                  <label className="casilla" key={t}><input type="checkbox" checked={f.temas.includes(t)} onChange={() => alternarTema(t)} /> {t}</label>
                ))}
              </div>
            </fieldset>
            <div className="campo">
              <label htmlFor="dificultad">Dificultad</label>
              <select id="dificultad" value={f.dificultad} onChange={e => cambiar("dificultad", e.target.value)}>
                <option value="">Cualquiera</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} · {NIVELES[n]}</option>)}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="jugadores">Somos…</label>
              <select id="jugadores" value={f.jugadores} onChange={e => cambiar("jugadores", e.target.value)}>
                <option value="">Cualquier número</option>
                {[2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} personas</option>)}
              </select>
            </div>
            <button className="boton boton-secundario boton-pequeno" type="button" onClick={() => setF(SIN_FILTROS)}>Quitar filtros</button>
          </form>
          <div className="pila">
            <div className="fila-entre">
              <p className="texto-suave" aria-live="polite">{salas && (lista.length === 1 ? "1 sala" : `${lista.length} salas`)}</p>
              <div className="campo" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <label htmlFor="orden">Ordenar por</label>
                <select id="orden" style={{ width: "auto" }} value={f.orden} onChange={e => cambiar("orden", e.target.value)}>
                  <option value="nombre">Nombre</option><option value="precio">Precio</option><option value="dificultad">Dificultad</option>
                </select>
              </div>
            </div>
            <div className="rejilla-salas">
              {error ? <Aviso tipo="error">{error.message}</Aviso>
                : !salas ? <Cargando texto="Cargando salas…" />
                : lista.length ? lista.map(s => <TarjetaSala key={s.id} sala={s} />)
                : <div className="tarjeta vacio" style={{ gridColumn: "1/-1" }}>Ninguna sala coincide con esos filtros. <button className="boton-enlace" type="button" onClick={() => setF(SIN_FILTROS)}>Quitar filtros</button></div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
