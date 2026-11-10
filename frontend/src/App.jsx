// Todas las rutas de la web. Cada grupo usa la plantilla de su zona y, si es privado,
// RutaProtegida comprueba que haya sesión y el rol adecuado.
import { Route, Routes } from "react-router-dom";
import RutaProtegida from "./components/RutaProtegida";
import { PlantillaAcceso, PlantillaCliente, PlantillaPanel, PlantillaPublica } from "./components/Plantillas";
import Inicio from "./pages/Inicio";
import Salas from "./pages/Salas";
import Sala from "./pages/Sala";
import SobreNosotros from "./pages/SobreNosotros";
import Ayuda from "./pages/Ayuda";
import Contacto from "./pages/Contacto";
import NoEncontrada from "./pages/NoEncontrada";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import MisTickets from "./pages/MisTickets";
import NuevoTicket from "./pages/NuevoTicket";
import TicketCliente from "./pages/TicketCliente";
import Perfil from "./pages/Perfil";
import Soporte from "./pages/Soporte";
import GestionTicket from "./pages/GestionTicket";
import Dashboard from "./pages/admin/Dashboard";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminSalas from "./pages/admin/AdminSalas";
import AdminCategorias from "./pages/admin/AdminCategorias";

const protegida = (roles, plantilla) => <RutaProtegida roles={roles}>{plantilla}</RutaProtegida>;

export default function App() {
  return (
    <Routes>
      {/* Web pública */}
      <Route element={<PlantillaPublica />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/salas" element={<Salas />} />
        <Route path="/salas/:slug" element={<Sala />} />
        <Route path="/sobre-nosotros" element={<SobreNosotros />} />
        <Route path="/ayuda" element={<Ayuda />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>

      {/* Acceso */}
      <Route element={<PlantillaAcceso />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      {/* Cliente */}
      <Route element={protegida(["cliente"], <PlantillaCliente />)}>
        <Route path="/mis-tickets" element={<MisTickets />} />
        <Route path="/nuevo-ticket" element={<NuevoTicket />} />
        <Route path="/tickets/:id" element={<TicketCliente />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      {/* Agente */}
      <Route element={protegida(["agente"], <PlantillaPanel />)}>
        <Route path="/soporte" element={<Soporte />} />
        <Route path="/soporte/tickets/:id" element={<GestionTicket />} />
      </Route>

      {/* Administrador */}
      <Route element={protegida(["admin"], <PlantillaPanel />)}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/tickets" element={<AdminTickets />} />
        <Route path="/admin/tickets/:id" element={<GestionTicket />} />
        <Route path="/admin/usuarios" element={<AdminUsuarios />} />
        <Route path="/admin/salas" element={<AdminSalas />} />
        <Route path="/admin/categorias" element={<AdminCategorias />} />
      </Route>
    </Routes>
  );
}
