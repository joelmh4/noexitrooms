// Iniciar sesión. Tras entrar, vuelve a la página que pedía sesión o va al inicio de su rol.
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PanelAcceso from "../components/PanelAcceso";
import { Aviso, Campo } from "../components/Piezas";
import { EMAIL_VALIDO, INICIO_POR_ROL } from "../utils/formato";

export default function Login() {
  const { usuario, login } = useAuth();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const volver = params.get("volver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Solo aceptamos rutas de esta web (nada de enlaces externos)
  const destino = rol => volver && volver.startsWith("/") && !volver.startsWith("//") ? volver : INICIO_POR_ROL[rol];

  async function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (!EMAIL_VALIDO.test(email.trim())) nuevos.email = "Escribe un email válido.";
    if (!password) nuevos.password = "Escribe tu contraseña.";
    setErrores(nuevos);
    setError("");
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      const u = await login(email, password);
      navegar(destino(u.role), { replace: true });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <PanelAcceso titulo="Bienvenido de nuevo" texto="Entra para seguir tus tickets o, si eres del equipo, para atender a los clientes.">
      <form className="formulario" noValidate onSubmit={enviar}>
        <h2>Iniciar sesión</h2>
        <div aria-live="polite">
          {error ? <Aviso tipo="error">{error}</Aviso>
            : volver ? <Aviso tipo="aviso">Inicia sesión para continuar.</Aviso>
            : usuario ? <Aviso tipo="info">Ya has iniciado sesión como {usuario.name}.</Aviso> : null}
        </div>
        <Campo id="email" etiqueta="Email" error={errores.email}>
          <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!errores.email} />
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={errores.password}>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!errores.password} />
        </Campo>
        <button className="boton boton-primario boton-bloque" type="submit" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
        <p className="texto-suave">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
      </form>
    </PanelAcceso>
  );
}
