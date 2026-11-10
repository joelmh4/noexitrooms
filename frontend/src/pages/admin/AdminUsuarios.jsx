// Gestión de usuarios (admin): cambiar rol y activar o desactivar cuentas
import { useState } from "react";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useAvisos } from "../../context/Avisos";
import { useDatos } from "../../utils/useDatos";
import { Aviso, Cargando } from "../../components/Piezas";
import { ROLES, fecha, iniciales } from "../../utils/formato";

export default function AdminUsuarios() {
  const { usuario: yo } = useAuth();
  const { toast, confirmar } = useAvisos();
  const { datos: usuarios, error, recargar } = useDatos(() => api.usuarios.listar());
  const [buscar, setBuscar] = useState("");
  const [rol, setRol] = useState("");
  if (error) return <Aviso tipo="error">{error.message}</Aviso>;
  if (!usuarios) return <Cargando texto="Cargando usuarios…" />;

  const texto = buscar.trim().toLowerCase();
  const visibles = usuarios.filter(u => (!texto || u.name.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto)) && (!rol || u.role === rol));

  async function cambiarRol(u, nuevo) {
    if (!await confirmar({ titulo: "Cambiar rol", texto: `${u.name} pasará a ser ${ROLES[nuevo]}.`, boton: "Cambiar rol" })) return;
    try {
      await api.usuarios.actualizar(u.id, { role: nuevo });
      toast("ok", `${u.name} ahora es ${ROLES[nuevo]}.`);
    } catch (err) {
      toast("error", err.message);
    }
    recargar();
  }

  async function alternarActiva(u) {
    if (u.is_active && !await confirmar({ titulo: "Desactivar cuenta", texto: `${u.name} no podrá iniciar sesión hasta que la actives de nuevo.`, boton: "Desactivar", peligro: true })) return;
    try {
      await api.usuarios.actualizar(u.id, { is_active: !u.is_active });
      toast("ok", u.is_active ? "Cuenta desactivada." : "Cuenta activada.");
    } catch (err) {
      toast("error", err.message);
    }
    recargar();
  }

  return (
    <>
      <div className="cabecera-pagina"><h1 style={{ fontSize: "2rem" }}>Usuarios</h1><span className="texto-suave" aria-live="polite">{visibles.length} usuarios</span></div>
      <form className="fila" role="search" aria-label="Filtrar usuarios" onSubmit={e => e.preventDefault()}>
        <div className="campo" style={{ flex: 1, minWidth: 220 }}>
          <label className="solo-lectores" htmlFor="buscar">Buscar</label>
          <input id="buscar" type="search" placeholder="Nombre o email" value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>
        <div className="campo" style={{ minWidth: 180 }}>
          <label className="solo-lectores" htmlFor="rol">Rol</label>
          <select id="rol" value={rol} onChange={e => setRol(e.target.value)}>
            <option value="">Todos los roles</option><option value="cliente">Clientes</option><option value="agente">Agentes</option><option value="admin">Administradores</option>
          </select>
        </div>
      </form>
      <div className="tabla-envoltorio">
        <table>
          <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Alta</th><th><span className="solo-lectores">Acciones</span></th></tr></thead>
          <tbody>
            {visibles.map(u => {
              const soyYo = u.id === yo.id;
              return (
                <tr key={u.id}>
                  <td data-etiqueta="Usuario" className="celda-principal"><div className="fila"><span className="avatar">{iniciales(u.name)}</span><div><strong>{u.name}</strong>{soyYo && <span className="subtexto"> (tú)</span>}<div className="subtexto">{u.email}</div></div></div></td>
                  <td data-etiqueta="Rol">
                    <label className="solo-lectores" htmlFor={`rol-${u.id}`}>Rol de {u.name}</label>
                    <select id={`rol-${u.id}`} className="boton boton-secundario boton-pequeno" value={u.role} disabled={soyYo} onChange={e => cambiarRol(u, e.target.value)}>
                      {Object.entries(ROLES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                    </select>
                  </td>
                  <td data-etiqueta="Estado"><span className={`pastilla ${u.is_active ? "pastilla-activa" : "pastilla-inactiva"}`}>{u.is_active ? "Activa" : "Desactivada"}</span></td>
                  <td data-etiqueta="Alta" className="subtexto">{fecha(u.created_at)}</td>
                  <td className="celda-acciones"><div className="acciones">
                    {!soyYo && <button className={`boton ${u.is_active ? "boton-secundario" : "boton-primario"} boton-pequeno`} onClick={() => alternarActiva(u)}>{u.is_active ? "Desactivar" : "Activar"}</button>}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
