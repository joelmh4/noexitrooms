iniciar(async yo => {
  const form = document.getElementById("filtros");
  const lista = document.getElementById("lista");
  let usuarios = await api.usuarios.listar();

  function pintar() {
    const texto = form.elements.buscar.value.trim().toLowerCase();
    const rol = form.elements.rol.value;
    const visibles = usuarios.filter(u =>
      (!texto || u.name.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto)) && (!rol || u.role === rol));
    document.getElementById("contador").textContent = `${visibles.length} usuarios`;
    lista.innerHTML = tabla(
      ["Usuario", "Rol", "Estado", "Alta", COLUMNA_ACCIONES],
      visibles.map(u => {
        const soyYo = u.id === yo.id;
        return `
        <tr>
          <td data-etiqueta="Usuario" class="celda-principal"><div class="fila"><span class="avatar">${esc(iniciales(u.name))}</span><div><strong>${esc(u.name)}</strong>${soyYo ? ' <span class="subtexto">(tú)</span>' : ""}<div class="subtexto">${esc(u.email)}</div></div></div></td>
          <td data-etiqueta="Rol">
            <label class="solo-lectores" for="rol-${u.id}">Rol de ${esc(u.name)}</label>
            <select id="rol-${u.id}" data-rol="${u.id}" class="boton boton-secundario boton-pequeno"${soyYo ? " disabled" : ""}>${opciones(Object.entries(ROLES), null, u.role)}</select>
          </td>
          <td data-etiqueta="Estado">${pastilla(u.is_active, u.is_active ? "Activa" : "Desactivada")}</td>
          <td data-etiqueta="Alta" class="subtexto">${fecha(u.created_at)}</td>
          <td class="celda-acciones"><div class="acciones">${soyYo ? "" : `<button class="boton ${u.is_active ? "boton-secundario" : "boton-primario"} boton-pequeno" data-activar="${u.id}">${u.is_active ? "Desactivar" : "Activar"}</button>`}</div></td>
        </tr>`;
      }).join(""));
  }

  async function recargar() {
    usuarios = await api.usuarios.listar();
    pintar();
  }

  lista.addEventListener("change", async e => {
    const select = e.target.closest("[data-rol]");
    if (!select) return;
    const u = usuarios.find(x => x.id === Number(select.dataset.rol));
    const ok = await confirmar("Cambiar rol", `${u.name} pasará a ser ${ROLES[select.value]}.`, "Cambiar rol")
      && await accion(select, () => api.usuarios.actualizar(u.id, { role: select.value }));
    if (!ok) { select.value = u.role; return; }
    toast("ok", `${u.name} ahora es ${ROLES[select.value]}.`);
    recargar();
  });
  lista.addEventListener("click", async e => {
    const b = e.target.closest("[data-activar]");
    if (!b) return;
    const u = usuarios.find(x => x.id === Number(b.dataset.activar));
    if (u.is_active && !await confirmar("Desactivar cuenta", `${u.name} no podrá iniciar sesión hasta que la actives de nuevo.`, "Desactivar", true)) return;
    if (!await accion(b, () => api.usuarios.actualizar(u.id, { is_active: !u.is_active }))) return;
    toast("ok", u.is_active ? "Cuenta desactivada." : "Cuenta activada.");
    recargar();
  });
  form.addEventListener("input", pintar);
  form.addEventListener("submit", e => e.preventDefault());
  pintar();
});
