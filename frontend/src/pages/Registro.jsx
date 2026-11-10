// Registro: siempre crea una cuenta de cliente (lo garantiza el backend)
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PanelAcceso from "../components/PanelAcceso";
import { Aviso, Campo } from "../components/Piezas";
import { EMAIL_VALIDO } from "../utils/formato";

export default function Registro() {
  const { registro } = useAuth();
  const navegar = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", repetir: "", condiciones: false });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const cambiar = e => setF({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (f.name.trim().length < 2) nuevos.name = "Escribe tu nombre.";
    if (!EMAIL_VALIDO.test(f.email.trim())) nuevos.email = "Escribe un email válido.";
    if (f.password.length < 8 || !/\d/.test(f.password)) nuevos.password = "Mínimo 8 caracteres y al menos un número.";
    if (f.repetir !== f.password) nuevos.repetir = "Las contraseñas no coinciden.";
    setErrores(nuevos);
    setError(f.condiciones ? "" : "Tienes que aceptar las condiciones de uso.");
    if (Object.keys(nuevos).length || !f.condiciones) return;

    try {
      await registro({ name: f.name, email: f.email, password: f.password });
      navegar("/mis-tickets?bienvenida=1", { replace: true });
    } catch (err) {
      if (err.status === 409) setErrores({ email: err.message });
      else setError(err.message);
    }
  }

  return (
    <PanelAcceso titulo="Crea tu cuenta" texto="Con tu cuenta puedes abrir tickets para reservas, bonos regalo, grupos o cualquier duda, y seguirlos desde tu área.">
      <form className="formulario" noValidate onSubmit={enviar}>
        <h2>Registro</h2>
        <div aria-live="polite">{error && <Aviso tipo="error">{error}</Aviso>}</div>
        <Campo id="name" etiqueta="Nombre y apellidos" error={errores.name}>
          <input id="name" name="name" autoComplete="name" maxLength={100} value={f.name} onChange={cambiar} aria-invalid={!!errores.name} />
        </Campo>
        <Campo id="email" etiqueta="Email" error={errores.email}>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={150} value={f.email} onChange={cambiar} aria-invalid={!!errores.email} />
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={errores.password} ayuda="Mínimo 8 caracteres y al menos un número.">
          <input id="password" name="password" type="password" autoComplete="new-password" value={f.password} onChange={cambiar} aria-invalid={!!errores.password} />
        </Campo>
        <Campo id="repetir" etiqueta="Repite la contraseña" error={errores.repetir}>
          <input id="repetir" name="repetir" type="password" autoComplete="new-password" value={f.repetir} onChange={cambiar} aria-invalid={!!errores.repetir} />
        </Campo>
        <label className="casilla"><input type="checkbox" name="condiciones" checked={f.condiciones} onChange={cambiar} /> Acepto las condiciones de uso y la política de privacidad</label>
        <button className="boton boton-primario boton-bloque" type="submit">Crear cuenta</button>
        <p className="texto-suave">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </PanelAcceso>
  );
}
