// Plantillas de cada zona de la web (se usan como "layout" en App.jsx con <Outlet />):
//   - Pública (tema oscuro): cabecera con menú, contenido y pie.
//   - Acceso (login y registro): solo el contenido.
//   - Cliente (tema claro): cabecera, menú de "Mi cuenta" a la izquierda y pie.
//   - Panel de soporte y admin (tema claro): menú lateral de la "sala de control" y barra superior.
import { startTransition, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Ticket, Plus, User, Inbox, LayoutDashboard, DoorClosed, Users, Tags, Globe, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { INICIO_POR_ROL, ROLES, iniciales, img } from "../utils/formato";

// Pone la clase del tema en <body> (los colores de cada tema están en css/estilos.css)
export function useTema(tema) {
  useEffect(() => { document.body.className = tema; }, [tema]);
}

// Al cambiar de página se vuelve arriba
function useArribaAlNavegar() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
}

function Logo({ oscuro }) {
  return <Link className="logo" to="/"><img src={img(`logo-candado${oscuro ? "-oscuro" : ""}.png`)} alt="" width="36" height="36" />NoExit<span>Rooms</span></Link>;
}

function useCerrarSesion() {
  const { logout } = useAuth();
  const navegar = useNavigate();
  // Las dos cosas a la vez (en la misma transición): si se borrara antes el usuario,
  // la ruta protegida mandaría al login en lugar de al inicio
  return () => startTransition(() => { navegar("/"); logout(); });
}

const MENU_PUBLICO = [["/", "Inicio"], ["/salas", "Salas"], ["/sobre-nosotros", "Sobre nosotros"], ["/ayuda", "Ayuda"], ["/contacto", "Contacto"]];

export function Cabecera({ oscuro }) {
  const { usuario } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [desplazada, setDesplazada] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setAbierto(false), [pathname]);
  // Borde suave bajo la cabecera solo cuando hay contenido pasando por debajo
  useEffect(() => {
    const revisar = () => setDesplazada(window.scrollY > 4);
    window.addEventListener("scroll", revisar, { passive: true });
    revisar();
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  return (
    <>
      <a className="solo-lectores" href="#contenido">Saltar al contenido</a>
      <header className={`cabecera${desplazada ? " desplazada" : ""}`}>
        <div className="contenedor">
          <Logo oscuro={oscuro} />
          <button className="boton-menu" aria-expanded={abierto} aria-controls="menu-principal" onClick={() => setAbierto(!abierto)}>
            <Menu /><span className="solo-lectores">Menú</span>
          </button>
          <nav className={`menu-principal${abierto ? " abierto" : ""}`} id="menu-principal" aria-label="Principal">
            {MENU_PUBLICO.map(([ruta, texto]) => <NavLink key={ruta} to={ruta} end={ruta === "/"}>{texto}</NavLink>)}
            {!usuario && <Link className="solo-movil" to="/login">Iniciar sesión</Link>}
          </nav>
          <div className="cabecera-acciones">
            {usuario ? (
              <Link className="usuario-chip" to={INICIO_POR_ROL[usuario.role]}>
                <span className="avatar">{iniciales(usuario.name)}</span><span>{usuario.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <>
                <Link className="boton boton-secundario boton-pequeno" to="/login">Iniciar sesión</Link>
                <Link className="boton boton-primario boton-pequeno" to="/nuevo-ticket">Abrir ticket</Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export function Pie() {
  return (
    <footer className="pie">
      <div className="contenedor">
        <div className="pila" style={{ gap: 8 }}>
          <span className="logo"><img src={img("logo-cerradura-oscuro.png")} alt="" width="44" height="44" />NoExit<span>Rooms</span></span>
          <small>Calle del Candado 13, Madrid · Proyecto trimestral DAW 2026</small>
          <small>Joel, Edu e Iván</small>
        </div>
        <div className="pila" style={{ gap: 6 }}>
          <h4>SALAS</h4>
          <Link to="/salas">Catálogo</Link>
          <Link to="/sobre-nosotros">Sobre nosotros</Link>
        </div>
        <div className="pila" style={{ gap: 6 }}>
          <h4>SOPORTE</h4>
          <Link to="/ayuda">Ayuda</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/nuevo-ticket">Abrir ticket</Link>
        </div>
      </div>
    </footer>
  );
}

export function PlantillaPublica() {
  useTema("tema-oscuro");
  useArribaAlNavegar();
  return (
    <>
      <Cabecera oscuro />
      <main id="contenido"><Outlet /></main>
      <Pie />
    </>
  );
}

export function PlantillaAcceso() {
  useTema("tema-oscuro");
  return <main id="contenido"><Outlet /></main>;
}

const MENU_CLIENTE = [["/mis-tickets", Ticket, "Mis tickets"], ["/nuevo-ticket", Plus, "Nuevo ticket"], ["/perfil", User, "Mi perfil"]];

export function PlantillaCliente() {
  useTema("tema-claro");
  useArribaAlNavegar();
  const { usuario } = useAuth();
  const cerrarSesion = useCerrarSesion();
  const { pathname } = useLocation();
  return (
    <>
      <Cabecera />
      <div className="panel-layout">
        <nav className="menu-cuenta" aria-label="Mi cuenta">
          <div className="tarjeta-usuario"><span className="avatar">{iniciales(usuario.name)}</span><span><b>{usuario.name}</b><small>{usuario.email}</small></span></div>
          {MENU_CLIENTE.map(([ruta, Icono, texto]) => (
            // El detalle de un ticket (/tickets/5) marca "Mis tickets"
            <Link key={ruta} to={ruta} aria-current={pathname === ruta || (ruta === "/mis-tickets" && pathname.startsWith("/tickets/")) ? "page" : undefined}>
              <Icono />{texto}
            </Link>
          ))}
          <button className="boton-enlace cerrar-sesion" type="button" onClick={cerrarSesion}><img className="icono-img" src={img("puerta.png")} alt="" />Cerrar sesión</button>
        </nav>
        <main id="contenido" className="contenido-panel"><Outlet /></main>
      </div>
      <Pie />
    </>
  );
}

const MENU_AGENTE = [["/soporte", Inbox, "Mis tickets"]];
const MENU_ADMIN = [
  ["/admin", LayoutDashboard, "Dashboard"],
  ["/admin/tickets", Ticket, "Tickets"],
  ["/admin/salas", DoorClosed, "Salas"],
  ["/admin/usuarios", Users, "Usuarios"],
  ["/admin/categorias", Tags, "Categorías"]
];
// Título que sale en la barra superior según la página
const TITULOS = {
  "/soporte": "Mis tickets", "/admin": "Dashboard", "/admin/tickets": "Todos los tickets",
  "/admin/salas": "Salas", "/admin/usuarios": "Usuarios", "/admin/categorias": "Categorías"
};
const horaMadrid = () => new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

export function PlantillaPanel() {
  useTema("tema-claro");
  useArribaAlNavegar();
  const { usuario } = useAuth();
  const cerrarSesion = useCerrarSesion();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [hora, setHora] = useState(horaMadrid);
  const [contador, setContador] = useState(null);
  const esAdmin = usuario.role === "admin";
  const enlaces = esAdmin ? MENU_ADMIN : MENU_AGENTE;
  // La gestión de un ticket marca como activa la lista de la que viene
  const activa = pathname.includes("/tickets/") ? (esAdmin ? "/admin/tickets" : "/soporte") : pathname;

  useEffect(() => setMenuAbierto(false), [pathname]);
  useEffect(() => {
    const reloj = setInterval(() => setHora(horaMadrid()), 15000);
    const cerrarConEsc = e => { if (e.key === "Escape") setMenuAbierto(false); };
    document.addEventListener("keydown", cerrarConEsc);
    return () => { clearInterval(reloj); document.removeEventListener("keydown", cerrarConEsc); };
  }, []);

  // Número junto al menú: lo que está esperando a alguien del equipo
  useEffect(() => {
    api.tickets.listar().then(tickets => {
      const n = esAdmin
        ? tickets.filter(t => t.agent_id === null && t.status !== "cerrado").length
        : tickets.filter(t => ["abierto", "en_curso"].includes(t.status)).length;
      setContador(n ? { ruta: esAdmin ? "/admin/tickets" : "/soporte", n, titulo: esAdmin ? `${n} sin asignar` : `${n} tuyos por atender` } : null);
    }).catch(() => { /* el menú funciona igual sin el número */ });
  }, [esAdmin, pathname]);

  return (
    <div className={`panel-admin${menuAbierto ? " menu-abierto" : ""}`}>
      <aside className="menu-lateral" id="menu-lateral" aria-label="Menú del panel">
        <div className="menu-lateral-cabeza">
          <Logo oscuro />
          <button className="boton-icono solo-movil-panel" type="button" onClick={() => setMenuAbierto(false)}><X /><span className="solo-lectores">Cerrar menú</span></button>
        </div>
        <p className="titulo-menu">Sala de control · {esAdmin ? "Administración" : "Soporte"}</p>
        <nav className="pila" style={{ gap: 4 }} aria-label="Panel">
          {enlaces.map(([ruta, Icono, texto]) => (
            <Link key={ruta} to={ruta} aria-current={ruta === activa ? "page" : undefined}>
              <Icono /><span>{texto}</span>
              {contador?.ruta === ruta && <span className="contador-menu" title={contador.titulo}>{contador.n}</span>}
            </Link>
          ))}
        </nav>
        <div className="pie-menu">
          <div className="tarjeta-usuario"><span className="avatar">{iniciales(usuario.name)}</span><span><b>{usuario.name}</b><small>{ROLES[usuario.role]}</small></span></div>
          <Link className="enlace-menu" to="/"><Globe />Ver la web</Link>
          <button className="enlace-menu cerrar-sesion" type="button" onClick={cerrarSesion}><img className="icono-img" src={img("puerta-oscuro.png")} alt="" />Cerrar sesión</button>
        </div>
      </aside>
      <div className="velo-menu" onClick={() => setMenuAbierto(false)}></div>
      <main id="contenido" className="contenido-admin">
        <div className="barra-panel">
          <button className="boton-icono boton-menu-panel" type="button" aria-expanded={menuAbierto} aria-controls="menu-lateral" onClick={() => setMenuAbierto(true)}>
            <Menu /><span className="solo-lectores">Menú</span>
          </button>
          <p className="ruta"><span>{esAdmin ? "Admin" : "Soporte"}</span><span aria-hidden="true">/</span><b>{TITULOS[pathname] || "Ticket"}</b></p>
          <p className="estado-sistema"><span className="piloto" aria-hidden="true"></span>Conectado<time>{hora}</time></p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
