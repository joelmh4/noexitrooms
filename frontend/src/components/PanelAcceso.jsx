// Mitad izquierda de login y registro: foto, logo y un texto de bienvenida
import { Link } from "react-router-dom";
import { img } from "../utils/formato";

export default function PanelAcceso({ titulo, texto, children }) {
  return (
    <div className="acceso">
      <div className="acceso-marca con-foto">
        <img className="acceso-fondo" src={img("acceso.webp")} alt="" width="1200" height="2150" />
        <Link className="logo" to="/"><img src={img("logo-candado-oscuro.png")} alt="" width="36" height="36" />NoExit<span>Rooms</span></Link>
        <div className="pila">
          <img src={img("logo-cerradura-oscuro.png")} alt="" width="96" height="96" />
          <h1 style={{ fontSize: "2.4rem" }}>{titulo}</h1>
          <p>{texto}</p>
        </div>
        <small style={{ color: "#9AA29A" }}>Calle del Candado 13, Madrid</small>
      </div>
      <div className="acceso-formulario">{children}</div>
    </div>
  );
}
