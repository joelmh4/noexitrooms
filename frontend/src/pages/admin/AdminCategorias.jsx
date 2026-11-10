// Categorías de tickets (admin): crear, renombrar y activar o desactivar
import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "../../api/api";
import { useAvisos } from "../../context/Avisos";
import { useDatos } from "../../utils/useDatos";
import { Aviso, Campo, Cargando } from "../../components/Piezas";

export default function AdminCategorias() {
  const { toast } = useAvisos();
  const { datos, error, recargar } = useDatos(() => Promise.all([api.categorias.listar({ todas: true }), api.tickets.listar()]));
  const [nueva, setNueva] = useState("");
  const [errorNueva, setErrorNueva] = useState("");
  const dialogo = useRef(null);
  const [renombrando, setRenombrando] = useState(null);   // { id, nombre, error }

  if (error) return <Aviso tipo="error">{error.message}</Aviso>;

  async function crear(e) {
    e.preventDefault();
    if (nueva.trim().length < 3) { setErrorNueva("Mínimo 3 caracteres."); return; }
    try {
      await api.categorias.crear(nueva.trim());
      setNueva("");
      setErrorNueva("");
      toast("ok", "Categoría creada.");
      recargar();
    } catch (err) {
      setErrorNueva(err.message);
    }
  }

  function abrirRenombrar(c) {
    setRenombrando({ id: c.id, nombre: c.name, error: "" });
    dialogo.current.showModal();
  }
  async function renombrar(e) {
    e.preventDefault();
    if (renombrando.nombre.trim().length < 3) { setRenombrando({ ...renombrando, error: "Mínimo 3 caracteres." }); return; }
    try {
      await api.categorias.actualizar(renombrando.id, { name: renombrando.nombre.trim() });
      dialogo.current.close();
      toast("ok", "Categoría renombrada.");
      recargar();
    } catch (err) {
      setRenombrando({ ...renombrando, error: err.message });
    }
  }

  async function alternarActiva(c) {
    try {
      await api.categorias.actualizar(c.id, { is_active: !c.is_active });
      toast("ok", c.is_active ? "Categoría desactivada." : "Categoría activada.");
    } catch (err) {
      toast("error", err.message);
    }
    recargar();
  }

  const [categorias, tickets] = datos || [[], []];
  return (
    <>
      <div className="cabecera-pagina"><h1 style={{ fontSize: "2rem" }}>Categorías de tickets</h1></div>
      <form className="tarjeta fila" noValidate style={{ alignItems: "end" }} onSubmit={crear}>
        <Campo id="nombre" etiqueta="Nueva categoría" error={errorNueva} style={{ flex: 1, minWidth: 240 }}>
          <input id="nombre" maxLength={80} placeholder="Por ejemplo: Accesibilidad" value={nueva} onChange={e => setNueva(e.target.value)} />
        </Campo>
        <button className="boton boton-primario" type="submit"><Plus /> Añadir</button>
      </form>
      {!datos ? <Cargando /> : (
        <div className="pila">
          <div className="tabla-envoltorio">
            <table>
              <thead><tr><th>Categoría</th><th>Tickets</th><th>Estado</th><th><span className="solo-lectores">Acciones</span></th></tr></thead>
              <tbody>
                {categorias.map(c => (
                  <tr key={c.id}>
                    <td data-etiqueta="Categoría" className="celda-principal"><strong>{c.name}</strong></td>
                    <td data-etiqueta="Tickets">{tickets.filter(t => t.category_id === c.id).length}</td>
                    <td data-etiqueta="Estado"><span className={`pastilla ${c.is_active ? "pastilla-activa" : "pastilla-inactiva"}`}>{c.is_active ? "Activa" : "Inactiva"}</span></td>
                    <td className="celda-acciones"><div className="acciones">
                      <button className="boton boton-secundario boton-pequeno" onClick={() => abrirRenombrar(c)}>Renombrar</button>
                      <button className="boton boton-secundario boton-pequeno" onClick={() => alternarActiva(c)}>{c.is_active ? "Desactivar" : "Activar"}</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="subtexto">Las categorías no se borran para no dejar tickets antiguos sin categoría: se desactivan y dejan de salir al crear un ticket.</p>
        </div>
      )}
      <dialog ref={dialogo} aria-labelledby="titulo-renombrar">
        {renombrando && (
          <form className="contenido-dialogo formulario" noValidate onSubmit={renombrar}>
            <h2 id="titulo-renombrar" style={{ fontSize: "1.4rem" }}>Renombrar categoría</h2>
            <Campo id="r-nombre" etiqueta="Nombre" error={renombrando.error}>
              <input id="r-nombre" maxLength={80} value={renombrando.nombre} onChange={e => setRenombrando({ ...renombrando, nombre: e.target.value })} />
            </Campo>
            <div className="fila" style={{ justifyContent: "flex-end" }}>
              <button className="boton boton-secundario" type="button" onClick={() => dialogo.current.close()}>Cancelar</button>
              <button className="boton boton-primario" type="submit">Guardar</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
