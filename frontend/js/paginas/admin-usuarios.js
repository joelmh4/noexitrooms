// Gestión de usuarios (admin): cambiar rol y activar o desactivar cuentas
iniciar(async yo => {
  const form = document.getElementById("filtros");
  let usuarios = await api.usuarios.listar();

  function pintar() {
    const texto = form.elements.buscar.value.trim().toLowerCase();
    const rol = form.elements.rol.value;
    const visibles = usuarios.filter(u =>
      (!texto || u.name.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto)) && (!rol || u.role === rol));
    document.getElementById("contador").textContent = `${visibles.length} usuarios`;
    document.getElementById("lista").innerHTML = `
      <div class="tabla-envoltorio">
        <table>
          <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Alta</th><th><span class="solo-lectores">Acciones</span></th></tr></thead>
          <tbody>
            ${visibles.map(u => {
              const soyYo = u.id === yo.id;
              return `
              <tr>
                <td><div class="fila"><span class="avatar">${esc(iniciales(u.name))}</span><div><strong>${esc(u.name)}</strong>${soyYo ? ' <span class="subtexto">(tú)</span>' : ""}<div class="subtexto">${esc(u.email)}</div></div></div></td>
                <td>
                  <label class="solo-lectores" for="rol-${u.id}">Rol de ${esc(u.name)}</label>
                  <select id="rol-${u.id}" data-rol="${u.id}" class="boton boton-secundario boton-pequeno"${soyYo ? " disabled" : ""}>
                    ${Object.entries(ROLES).map(([v, t]) => `<option value="${v}"${v === u.role ? " selected" : ""}>${t}</option>`).join("")}
                  </select>
                </td>
                <td><span class="pastilla ${u.is_active ? "pastilla-activa" : "pastilla-inactiva"}">${u.is_active ? "Activa" : "Desactivada"}</span></td>
                <td class="subtexto">${fecha(u.created_at)}</td>
                <td><div class="acciones">${soyYo ? "" : `<button class="boton ${u.is_active ? "boton-secundario" : "boton-primario"} boton-pequeno" data-activar="${u.id}">${u.is_active ? "Desactivar" : "Activar"}</button>`}</div></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;
  }

  const lista = document.getElementById("lista");
  lista.addEventListener("change", async e => {
    const select = e.target.closest("[data-rol]");
    if (!select) return;
    const u = usuarios.find(x => x.id === Number(select.dataset.rol));
    if (!await confirmar("Cambiar rol", `${u.name} pasará a ser ${ROLES[select.value]}.`, "Cambiar rol")) { select.value = u.role; return; }
    await api.usuarios.actualizar(u.id, { role: select.value });
    toast("ok", `${u.name} ahora es ${ROLES[select.value]}.`);
    usuarios = await api.usuarios.listar();
    pintar();
  });
  lista.addEventListener("click", async e => {
    const b = e.target.closest("[data-activar]");
    if (!b) return;
    const u = usuarios.find(x => x.id === Number(b.dataset.activar));
    if (u.is_active && !await confirmar("Desactivar cuenta", `${u.name} no podrá iniciar sesión hasta que la actives de nuevo.`, "Desactivar", true)) return;
    await api.usuarios.actualizar(u.id, { is_active: !u.is_active });
    toast("ok", u.is_active ? "Cuenta desactivada." : "Cuenta activada.");
    usuarios = await api.usuarios.listar();
    pintar();
  });
  form.addEventListener("input", pintar);
  form.addEventListener("submit", e => e.preventDefault());
  pintar();
});
