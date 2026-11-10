// Ruta que exige sesión y uno de los roles indicados (como el ProtectedRoute de la guía de clase).
// Es solo para la experiencia de uso: la protección de verdad la hace el backend con el token (401/403/404).
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Aviso } from "./Piezas";
import { Cabecera, Pie, useTema } from "./Plantillas";
import { INICIO_POR_ROL } from "../utils/formato";

function SinAcceso() {
  const { usuario } = useAuth();
  useTema("tema-claro");
  return (
    <>
      <Cabecera />
      <main id="contenido">
        <div className="contenedor seccion pila">
          <Aviso tipo="error">No tienes acceso a esta página con tu cuenta.</Aviso>
          <Link className="boton boton-primario" to={INICIO_POR_ROL[usuario.role]}>Ir a mi inicio</Link>
        </div>
      </main>
      <Pie />
    </>
  );
}

export default function RutaProtegida({ roles, children }) {
  const { usuario } = useAuth();
  const { pathname, search } = useLocation();
  if (!usuario) return <Navigate to={`/login?volver=${encodeURIComponent(pathname + search)}`} replace />;
  if (!roles.includes(usuario.role)) return <SinAcceso />;
  return children;
}
