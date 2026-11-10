// Gestión de salas (admin): el CRUD del negocio. Crear, editar, activar o desactivar y borrar.
import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../api/api";
import { useAvisos } from "../../context/Avisos";
import { useDatos } from "../../utils/useDatos";
import { Aviso, Campo, Cargando, Dificultad } from "../../components/Piezas";
import { NIVELES, TEMATICAS, precio } from "../../utils/formato";

const SALA_NUEVA = {
  name: "", tagline: "", theme: TEMATICAS[0], difficulty: 3, duration_min: 60, min_players: 2, max_players: 6,
  price_per_person: "", min_age: 0, description: "", challenges: "", is_active: true
};

// Las mismas reglas que los CHECK de la tabla rooms (el backend vuelve a comprobarlas)
function validar(d) {
  const e = {};
  if (d.name.trim().length < 3) e.name = "Mínimo 3 caracteres.";
  if (!(d.duration_min >= 15 && d.duration_min <= 180)) e.duration_min = "Entre 15 y 180 minutos.";
  if (!(d.min_players >= 1)) e.min_players = "Al menos 1.";
  if (!(d.max_players >= d.min_players)) e.max_players = "No puede ser menor que el mínimo.";
  if (d.price_per_person === "" || !(Number(d.price_per_person) >= 0)) e.price_per_person = "Escribe un precio.";
  if (!(d.min_age >= 0 && d.min_age <= 99)) e.min_age = "Entre 0 y 99.";
  if (d.description.trim().length < 20) e.description = "Mínimo 20 caracteres.";
  return e;
}

export default function AdminSalas() {
  const { toast, confirmar } = useAvisos();
  const { datos: salas, error, recargar } = useDatos(() => api.salas.listar({ todas: true }));
  const dialogo = useRef(null);
  const [editando, setEditando] = useState(null);   // null = sala nueva
  const [f, setF] = useState(SALA_NUEVA);
  const [errores, setErrores] = useState({});

  if (error) return <Aviso tipo="error">{error.message}</Aviso>;

  function abrir(sala) {
    setEditando(sala);
    setF(sala ? { ...SALA_NUEVA, ...sala, tagline: sala.tagline ?? "", challenges: sala.challenges ?? "" } : SALA_NUEVA);
    setErrores({});
    dialogo.current.showModal();
  }
  const cambiar = e => {
    const { name, type, value, checked } = e.target;
    setF({ ...f, [name]: type === "checkbox" ? checked : type === "number" || name === "difficulty" ? (value === "" ? "" : Number(value)) : value });
  };

  async function guardar(e) {
    e.preventDefault();
    const nuevos = validar(f);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    const datos = {
      name: f.name.trim(), theme: f.theme, difficulty: Number(f.difficulty), duration_min: Number(f.duration_min),
      min_players: Number(f.min_players), max_players: Number(f.max_players), price_per_person: Number(f.price_per_person),
      min_age: Number(f.min_age || 0), tagline: f.tagline.trim(), description: f.description.trim(), challenges: f.challenges.trim(), is_active: f.is_active
    };
    try {
      if (editando) await api.salas.actualizar(editando.id, datos);
      else await api.salas.crear(datos);
      dialogo.current.close();
      toast("ok", editando ? "Sala guardada." : "Sala creada.");
      recargar();
    } catch (err) {
      setErrores(err.campos || { name: err.message });
    }
  }

  async function alternarActiva(sala) {
    try {
      await api.salas.actualizar(sala.id, { ...sala, is_active: !sala.is_active });
      toast("ok", sala.is_active ? "Sala desactivada: ya no sale en el catálogo." : "Sala activada.");
    } catch (err) {
      toast("error", err.message);
    }
    recargar();
  }

  async function borrar(sala) {
    if (!await confirmar({ titulo: "Borrar sala", texto: `Vas a borrar "${sala.name}". No se puede deshacer.`, boton: "Borrar", peligro: true })) return;
    try {
      await api.salas.borrar(sala.id);
      toast("ok", "Sala borrada.");
    } catch (err) {
      toast("error", err.message);   // 409 si tiene tickets o reservas: hay que desactivarla
    }
    recargar();
  }

  const numero = (nombre, etiqueta, props = {}) => (
    <Campo id={`s-${nombre}`} etiqueta={etiqueta} error={errores[nombre]} style={{ flex: 1 }}>
      <input id={`s-${nombre}`} name={nombre} type="number" value={f[nombre]} onChange={cambiar} {...props} />
    </Campo>
  );

  return (
    <>
      <div className="cabecera-pagina"><h1 style={{ fontSize: "2rem" }}>Salas</h1><button className="boton boton-primario" type="button" onClick={() => abrir(null)}><Plus /> Nueva sala</button></div>
      {!salas ? <Cargando texto="Cargando salas…" /> : (
        <div className="tabla-envoltorio">
          <table>
            <thead><tr><th>Sala</th><th>Temática</th><th>Dificultad</th><th>Duración</th><th>Jugadores</th><th>Precio</th><th>Estado</th><th><span className="solo-lectores">Acciones</span></th></tr></thead>
            <tbody>
              {salas.map(s => (
                <tr key={s.id}>
                  <td data-etiqueta="Sala" className="celda-principal"><strong>{s.name}</strong><div className="subtexto">/{s.slug}</div></td>
                  <td data-etiqueta="Temática">{s.theme}</td>
                  <td data-etiqueta="Dificultad"><Dificultad nivel={s.difficulty} /></td>
                  <td data-etiqueta="Duración">{s.duration_min} min</td>
                  <td data-etiqueta="Jugadores">{s.min_players}-{s.max_players}</td>
                  <td data-etiqueta="Precio">{precio(s.price_per_person)}</td>
                  <td data-etiqueta="Estado"><span className={`pastilla ${s.is_active ? "pastilla-activa" : "pastilla-inactiva"}`}>{s.is_active ? "Activa" : "Inactiva"}</span></td>
                  <td className="celda-acciones"><div className="acciones">
                    <button className="boton boton-secundario boton-pequeno" onClick={() => abrir(s)}>Editar</button>
                    <button className="boton boton-secundario boton-pequeno" onClick={() => alternarActiva(s)}>{s.is_active ? "Desactivar" : "Activar"}</button>
                    <button className="boton boton-peligro boton-pequeno" aria-label={`Borrar ${s.name}`} onClick={() => borrar(s)}><Trash2 /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog ref={dialogo} aria-labelledby="titulo-dialogo" style={{ width: "min(720px,calc(100% - 32px))" }}>
        <form className="contenido-dialogo formulario" noValidate onSubmit={guardar}>
          <h2 id="titulo-dialogo" style={{ fontSize: "1.4rem" }}>{editando ? "Editar sala" : "Nueva sala"}</h2>
          <Campo id="s-name" etiqueta="Nombre" error={errores.name}><input id="s-name" name="name" maxLength={100} value={f.name} onChange={cambiar} /></Campo>
          <Campo id="s-tagline" etiqueta="Lema" error={errores.tagline}><input id="s-tagline" name="tagline" maxLength={150} value={f.tagline} onChange={cambiar} /></Campo>
          <div className="fila" style={{ alignItems: "start" }}>
            <Campo id="s-theme" etiqueta="Temática" style={{ flex: 1 }}>
              <select id="s-theme" name="theme" value={f.theme} onChange={cambiar}>{TEMATICAS.map(t => <option key={t}>{t}</option>)}</select>
            </Campo>
            <Campo id="s-difficulty" etiqueta="Dificultad" style={{ flex: 1 }}>
              <select id="s-difficulty" name="difficulty" value={f.difficulty} onChange={cambiar}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} · {NIVELES[n]}</option>)}</select>
            </Campo>
          </div>
          <div className="fila" style={{ alignItems: "start" }}>
            {numero("duration_min", "Duración (min)", { min: 15, max: 180 })}
            {numero("min_players", "Jugadores mín.", { min: 1 })}
            {numero("max_players", "Jugadores máx.", { min: 1 })}
          </div>
          <div className="fila" style={{ alignItems: "start" }}>
            {numero("price_per_person", "Precio por persona (€)", { min: 0, step: 0.5 })}
            {numero("min_age", "Edad mínima", { min: 0, max: 99 })}
          </div>
          <Campo id="s-description" etiqueta="Descripción" error={errores.description}><textarea id="s-description" name="description" value={f.description} onChange={cambiar} /></Campo>
          <Campo id="s-challenges" etiqueta="Pruebas de la sala (una por línea)" error={errores.challenges}><textarea id="s-challenges" name="challenges" rows={3} maxLength={2000} value={f.challenges} onChange={cambiar} /></Campo>
          <label className="casilla"><input type="checkbox" name="is_active" checked={f.is_active} onChange={cambiar} /> Sala activa (sale en el catálogo)</label>
          <div className="fila" style={{ justifyContent: "flex-end" }}>
            <button className="boton boton-secundario" type="button" onClick={() => dialogo.current.close()}>Cancelar</button>
            <button className="boton boton-primario" type="submit">Guardar sala</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
