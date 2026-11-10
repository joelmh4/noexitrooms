// Sobre nosotros y sobre el proyecto
import { MapPin, Puzzle, Accessibility } from "lucide-react";
import { Foto } from "../components/Piezas";
import { img } from "../utils/formato";

const EQUIPO = [
  { foto: "joel", nombre: "Joel", cartel: "JOEL", numero: "2026-0001", altura: "62%", papel: "Diseño de la interfaz y frontend.",
    cargos: ["Esconder números en la oscuridad de la portada.", "Pedir «hazlo todo» a las diez y media de la noche."] },
  { foto: "edu", nombre: "Edu", cartel: "EDU", numero: "2026-0002", altura: "58%", papel: "Backend y API. Capitán honorífico de su propio camarote.",
    cargos: ["Vaciar la despensa del barco.", "Negar haber visto las galletas."] },
  { foto: "ivan", nombre: "Iván", cartel: "IVÁN", numero: "2026-0003", altura: "64%", papel: "Base de datos y despliegue.",
    cargos: ["Encerrar los datos en MySQL y perder la llave.", "Normalizar hasta la lista de la compra."] }
];
const TECNOLOGIAS = ["React", "Vite", "React Router", "Node.js + Express", "TypeScript", "MySQL", "JWT", "Swagger"];

export default function SobreNosotros() {
  return (
    <>
      <section className="seccion">
        <div className="contenedor">
          <div className="pila" style={{ gap: 8, maxWidth: 760 }}>
            <span className="etiqueta-superior">Sobre nosotros</span>
            <h1>Encerramos gente por diversión</h1>
            <p className="texto-suave" style={{ fontSize: "1.15rem" }}>NoExitRooms nace en Madrid con seis salas en las que el humor, el terror y un poco de mala leche conviven con enigmas de verdad. Nada de candados al azar: cada prueba cuenta parte de la historia.</p>
          </div>
          <div className="pasos" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
            <div className="paso"><MapPin /><h3>El local</h3><p>Una antigua imprenta de 400 m² en Madrid con seis salas insonorizadas y una zona de espera con juegos de mesa.</p></div>
            <div className="paso"><Puzzle /><h3>Las salas</h3><p>Diseñadas y construidas por nosotros. Cada temporada renovamos al menos una.</p></div>
            <div className="paso"><Accessibility /><h3>Para todos</h3><p>Tres salas accesibles en silla de ruedas y versiones para familias con niños.</p></div>
          </div>
        </div>
      </section>
      <section className="seccion">
        <div className="contenedor">
          <div className="pila" style={{ gap: 8 }}><span className="etiqueta-superior">El equipo</span><h2>Los sospechosos habituales</h2></div>
          <div className="equipo-policial">
            {EQUIPO.map(p => (
              <article className="ficha-policial" key={p.foto}>
                <div className="ficha-policial-foto" style={{ "--altura": p.altura }}>
                  <Foto src={img(`equipo/${p.foto}.webp`)} alt={`Foto de ${p.nombre}`} loading="lazy" />
                  <div className="ficha-policial-cartel"><span>NOEXIT ROOMS · MADRID</span><b>{p.cartel}</b><span>{p.numero} · 28.10.26</span></div>
                </div>
                <div className="ficha-policial-datos">
                  <h3>{p.nombre}</h3>
                  <p className="texto-suave">{p.papel}</p>
                  <p className="ficha-policial-cargos-titulo">Cargos</p>
                  <ul className="ficha-policial-cargos">{p.cargos.map(c => <li key={c}>{c}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="seccion">
        <div className="contenedor">
          <div className="tarjeta">
            <span className="etiqueta-superior">Sobre el proyecto</span>
            <h2>Proyecto trimestral de DAW</h2>
            <p className="texto-suave">Esta web es el proyecto trimestral del ciclo de Desarrollo de Aplicaciones Web. Une una web pública de escape rooms con un sistema de soporte por tickets con tres roles (cliente, agente y administrador).</p>
            <div className="fila">{TECNOLOGIAS.map(t => <span key={t} className="pastilla pastilla-inactiva">{t}</span>)}</div>
          </div>
        </div>
      </section>
    </>
  );
}
