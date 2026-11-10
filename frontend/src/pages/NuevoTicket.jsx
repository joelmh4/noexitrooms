// Nuevo ticket (cliente)
import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import { useDatos } from "../utils/useDatos";
import { Aviso, Campo, Cargando } from "../components/Piezas";

export default function NuevoTicket() {
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const { datos, error } = useDatos(() => Promise.all([api.categorias.listar(), api.salas.listar()]));
  const [f, setF] = useState({ subject: "", category_id: "", room_id: "", priority: "media", description: "" });
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const cambiar = e => setF({ ...f, [e.target.name]: e.target.value });

  // Rellenamos el formulario según de dónde venga el cliente
  useEffect(() => {
    if (!datos) return;
    const [categorias, salas] = datos;
    const categoria = inicio => categorias.find(c => c.name.startsWith(inicio))?.id || "";
    const desdeSala = salas.find(s => s.slug === params.get("sala"));
    if (desdeSala) setF(x => ({ ...x, room_id: desdeSala.id, category_id: categoria("Reservas"), subject: `Reserva en ${desdeSala.name}` }));
    if (params.get("bono") === "NOEXIT-1974") setF(x => ({ ...x, category_id: categoria("Bonos"), subject: "Canjear código NOEXIT-1974",
      description: "Quiero canjear el código NOEXIT-1974 (10 % de descuento en nuestra primera sala)." }));
    if (params.get("regalo")) setF(x => ({ ...x, category_id: categoria("Bonos"), subject: "Quiero regalar un bono" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos]);

  async function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (f.subject.trim().length < 5) nuevos.subject = "El asunto necesita al menos 5 caracteres.";
    if (!f.category_id) nuevos.category_id = "Elige una categoría.";
    if (f.description.trim().length < 20) nuevos.description = "Cuéntanos un poco más (mínimo 20 caracteres).";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    setEnviando(true);
    try {
      const ticket = await api.tickets.crear({ ...f, category_id: Number(f.category_id), room_id: f.room_id ? Number(f.room_id) : null });
      navegar(`/tickets/${ticket.id}?nuevo=1`);
    } catch (err) {
      setErrorEnvio(err.message);
      setEnviando(false);
    }
  }

  if (error) return <Aviso tipo="error">{error.message}</Aviso>;
  if (!datos) return <Cargando />;
  const [categorias, salas] = datos;
  return (
    <>
      <div className="cabecera-pagina"><h1 style={{ fontSize: "2rem" }}>Nuevo ticket</h1></div>
      <form className="tarjeta formulario" noValidate style={{ maxWidth: 760 }} onSubmit={enviar}>
        {errorEnvio && <Aviso tipo="error">{errorEnvio}</Aviso>}
        <Campo id="subject" etiqueta="Asunto" error={errores.subject} ayuda="Resume tu consulta en una frase.">
          <input id="subject" name="subject" maxLength={150} value={f.subject} onChange={cambiar} aria-invalid={!!errores.subject} />
        </Campo>
        <div className="fila" style={{ alignItems: "start" }}>
          <Campo id="category_id" etiqueta="Categoría" error={errores.category_id} style={{ flex: 1, minWidth: 220 }}>
            <select id="category_id" name="category_id" value={f.category_id} onChange={cambiar} aria-invalid={!!errores.category_id}>
              <option value="">Elige una categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Campo>
          <Campo id="room_id" etiqueta="Sala (opcional)" style={{ flex: 1, minWidth: 220 }}>
            <select id="room_id" name="room_id" value={f.room_id} onChange={cambiar}>
              <option value="">Ninguna en concreto</option>
              {salas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Campo>
        </div>
        <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="etiqueta" style={{ marginBottom: 6 }}>Prioridad</legend>
          <div className="grupo-botones">
            {[["baja", "Baja"], ["media", "Media"], ["alta", "Alta"]].map(([valor, texto]) => (
              <Fragment key={valor}>
                <input type="radio" id={`p-${valor}`} name="priority" value={valor} checked={f.priority === valor} onChange={cambiar} />
                <label className="boton boton-secundario boton-pequeno" htmlFor={`p-${valor}`}>{texto}</label>
              </Fragment>
            ))}
          </div>
        </fieldset>
        <Campo id="description" etiqueta="Descripción" error={errores.description} ayuda={`${f.description.length} / 2000`}>
          <textarea id="description" name="description" maxLength={2000} value={f.description} onChange={cambiar} aria-invalid={!!errores.description}
            placeholder="Cuéntanos qué necesitas: fecha, número de personas, código del bono…" />
        </Campo>
        <div className="fila" style={{ justifyContent: "flex-end" }}>
          <Link className="boton boton-secundario" to="/mis-tickets">Cancelar</Link>
          <button className="boton boton-primario" type="submit" disabled={enviando}>Enviar ticket</button>
        </div>
      </form>
    </>
  );
}
