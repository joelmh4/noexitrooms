// Mi perfil (cliente): datos personales y cambio de contraseña
import { useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useAvisos } from "../context/Avisos";
import { Campo } from "../components/Piezas";
import { EMAIL_VALIDO, iniciales } from "../utils/formato";

export default function Perfil() {
  const { usuario, actualizarPerfil } = useAuth();
  const { toast } = useAvisos();
  const [datos, setDatos] = useState({ name: usuario.name, email: usuario.email });
  const [claves, setClaves] = useState({ actual: "", nueva: "", repetir: "" });
  const [erroresDatos, setErroresDatos] = useState({});
  const [erroresClaves, setErroresClaves] = useState({});

  async function guardarDatos(e) {
    e.preventDefault();
    const nuevos = {};
    if (datos.name.trim().length < 2) nuevos.name = "Escribe tu nombre.";
    if (!EMAIL_VALIDO.test(datos.email.trim())) nuevos.email = "Escribe un email válido.";
    setErroresDatos(nuevos);
    if (Object.keys(nuevos).length) return;
    try {
      await actualizarPerfil(datos);
      toast("ok", "Datos guardados.");
    } catch (err) {
      setErroresDatos({ email: err.message });
    }
  }

  async function cambiarClave(e) {
    e.preventDefault();
    const nuevos = {};
    if (!claves.actual) nuevos.actual = "Escribe tu contraseña actual.";
    if (claves.nueva.length < 8 || !/\d/.test(claves.nueva)) nuevos.nueva = "Mínimo 8 caracteres y al menos un número.";
    if (claves.repetir !== claves.nueva) nuevos.repetir = "Las contraseñas no coinciden.";
    setErroresClaves(nuevos);
    if (Object.keys(nuevos).length) return;
    try {
      await api.perfil.cambiarPassword(claves.actual, claves.nueva);
      setClaves({ actual: "", nueva: "", repetir: "" });
      toast("ok", "Contraseña cambiada.");
    } catch (err) {
      setErroresClaves({ actual: err.message });
    }
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div className="fila"><span className="avatar" style={{ width: 56, height: 56, fontSize: "1.2rem" }}>{iniciales(usuario.name)}</span><h1 style={{ fontSize: "2rem" }}>Mi perfil</h1></div>
      </div>
      <div className="ficha" style={{ gap: 24, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <form className="tarjeta formulario" noValidate onSubmit={guardarDatos}>
          <h2 className="tarjeta-titulo">Datos personales</h2>
          <Campo id="name" etiqueta="Nombre y apellidos" error={erroresDatos.name}>
            <input id="name" autoComplete="name" maxLength={100} value={datos.name} onChange={e => setDatos({ ...datos, name: e.target.value })} />
          </Campo>
          <Campo id="email" etiqueta="Email" error={erroresDatos.email}>
            <input id="email" type="email" autoComplete="email" maxLength={150} value={datos.email} onChange={e => setDatos({ ...datos, email: e.target.value })} />
          </Campo>
          <div className="fila" style={{ justifyContent: "flex-end" }}><button className="boton boton-primario" type="submit">Guardar cambios</button></div>
        </form>
        <form className="tarjeta formulario" noValidate onSubmit={cambiarClave}>
          <h2 className="tarjeta-titulo">Cambiar contraseña</h2>
          <Campo id="actual" etiqueta="Contraseña actual" error={erroresClaves.actual}>
            <input id="actual" type="password" autoComplete="current-password" value={claves.actual} onChange={e => setClaves({ ...claves, actual: e.target.value })} />
          </Campo>
          <Campo id="nueva" etiqueta="Nueva contraseña" error={erroresClaves.nueva} ayuda="Mínimo 8 caracteres y al menos un número.">
            <input id="nueva" type="password" autoComplete="new-password" value={claves.nueva} onChange={e => setClaves({ ...claves, nueva: e.target.value })} />
          </Campo>
          <Campo id="repetir" etiqueta="Repite la nueva contraseña" error={erroresClaves.repetir}>
            <input id="repetir" type="password" autoComplete="new-password" value={claves.repetir} onChange={e => setClaves({ ...claves, repetir: e.target.value })} />
          </Campo>
          <div className="fila" style={{ justifyContent: "flex-end" }}><button className="boton boton-primario" type="submit">Cambiar contraseña</button></div>
        </form>
      </div>
    </>
  );
}
