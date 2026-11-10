// Contacto
import { Link } from "react-router-dom";
import { MapPin, Clock, Mail, Map } from "lucide-react";
import { img } from "../utils/formato";

export default function Contacto() {
  return (
    <section className="seccion">
      <div className="contenedor">
        <div className="pila" style={{ gap: 8 }}><span className="etiqueta-superior">Contacto</span><h1>Ven a vernos (y a quedarte encerrado)</h1></div>
        <figure className="foto-banda">
          <img src={img("contacto.webp")} alt="Mostrador de recepción con un timbre y un reloj de cuenta atrás." loading="lazy" width="1600" height="893" />
          <figcaption>La recepción. Tocad el timbre: el reloj empieza a contar en cuanto entráis.</figcaption>
        </figure>
        <div className="pasos" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
          <div className="paso"><MapPin /><h3>Dirección</h3><p>Calle del Candado 13<br />28012 Madrid<br />Metro Tirso de Molina (L1)</p></div>
          <div className="paso"><Clock /><h3>Horario</h3><p>Lunes a jueves: 16:00 a 23:00<br />Viernes a domingo: 10:00 a 01:00</p></div>
          <div className="paso"><Mail /><h3>Escríbenos</h3><p>hola@noexitrooms.example<br />Para reservas, bonos o incidencias, mejor por ticket.</p></div>
        </div>
        <div className="ficha">
          <div className="tarjeta" style={{ minHeight: 280, justifyContent: "center", alignItems: "center", background: "var(--superficie-2)" }}>
            <Map style={{ width: 48, height: 48, color: "var(--texto-suave)" }} />
            <p className="texto-suave">Aquí irá el mapa (Google Maps u OpenStreetMap).</p>
          </div>
          <div className="tarjeta">
            <h2 style={{ fontSize: "1.4rem" }}>Soporte por tickets</h2>
            <p className="texto-suave">Inicia sesión y abre un ticket. Verás el estado en todo momento y todas las respuestas quedan guardadas en tu área de cliente.</p>
            <Link className="boton boton-primario" to="/nuevo-ticket">Abrir un ticket</Link>
            <Link className="boton boton-secundario" to="/registro">Crear una cuenta</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
