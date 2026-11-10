// 404: cualquier ruta que no existe
import { Link } from "react-router-dom";
import { img } from "../utils/formato";

export default function NoEncontrada() {
  return (
    <section className="seccion error-pagina">
      <div className="contenedor" style={{ maxWidth: 720, textAlign: "center", alignItems: "center" }}>
        <div className="cuenta-atras" style={{ width: "100%" }}>
          <img src={img("puerta-oscuro.png")} alt="" width="140" height="140" />
          <span className="reloj">404</span>
          <small>Código de error</small>
        </div>
        <h1 style={{ fontSize: "2.2rem" }}>Esta puerta no lleva a ningún sitio</h1>
        <p className="texto-suave">La página que buscas no existe o la han movido. Pero hay otras puertas.</p>
        <div className="fila" style={{ justifyContent: "center" }}>
          <Link className="boton boton-primario" to="/">Volver al inicio</Link>
          <Link className="boton boton-secundario" to="/salas">Ver las salas</Link>
        </div>
      </div>
    </section>
  );
}
