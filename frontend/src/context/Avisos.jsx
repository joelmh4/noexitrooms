// Avisos flotantes (toast) y diálogo de confirmación, disponibles en toda la web:
//   const { toast, confirmar } = useAvisos();
//   toast("ok", "Guardado.");
//   if (await confirmar({ titulo, texto, boton, peligro })) { ... }
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Aviso } from "../components/Piezas";

const AvisosContext = createContext(null);
export const useAvisos = () => useContext(AvisosContext);

export function AvisosProvider({ children }) {
  const [notificacion, setNotificacion] = useState(null);   // { tipo, texto, id }
  const [visible, setVisible] = useState(false);
  const [pregunta, setPregunta] = useState(null);           // { titulo, texto, boton, peligro, resolver }
  const dialogo = useRef(null);

  function toast(tipo, texto) {
    setNotificacion({ tipo, texto, id: Date.now() });
  }

  // Aparece un instante después (para que se vea la transición de CSS) y se va sola a los 4 segundos
  useEffect(() => {
    if (!notificacion) return;
    const entrar = setTimeout(() => setVisible(true), 10);
    const salir = setTimeout(() => setVisible(false), 4000);
    return () => { clearTimeout(entrar); clearTimeout(salir); };
  }, [notificacion]);

  function confirmar({ titulo, texto, boton = "Confirmar", peligro = false }) {
    return new Promise(resolver => setPregunta({ titulo, texto, boton, peligro, resolver }));
  }
  useEffect(() => { if (pregunta) dialogo.current.showModal(); }, [pregunta]);
  function responder(si) {
    pregunta.resolver(si);
    dialogo.current.close();
    setPregunta(null);
  }

  return (
    <AvisosContext.Provider value={{ toast, confirmar }}>
      {children}
      {notificacion && (
        <div className={`toast${visible ? " visible" : ""}`} key={notificacion.id}>
          <Aviso tipo={notificacion.tipo}>{notificacion.texto}</Aviso>
          <button className="toast-cerrar" type="button" aria-label="Cerrar aviso" onClick={() => setVisible(false)}>×</button>
        </div>
      )}
      <dialog ref={dialogo} onCancel={() => pregunta && responder(false)}>
        {pregunta && (
          <div className="contenido-dialogo">
            <h3>{pregunta.titulo}</h3>
            <p className="texto-suave">{pregunta.texto}</p>
            <div className="fila" style={{ justifyContent: "flex-end" }}>
              <button className="boton boton-secundario" type="button" onClick={() => responder(false)}>Cancelar</button>
              <button className={`boton ${pregunta.peligro ? "boton-peligro" : "boton-primario"}`} type="button" onClick={() => responder(true)}>{pregunta.boton}</button>
            </div>
          </div>
        )}
      </dialog>
    </AvisosContext.Provider>
  );
}
