// Categorías de tickets (admin): crear, renombrar y activar o desactivar
iniciar(async () => {
  const formNueva = document.getElementById("form-nueva");
  const tickets = await api.tickets.listar();

  async function pintar() {
    const categorias = await api.categorias.listar({ todas: true });
    document.getElementById("lista").innerHTML = `
      <div class="tabla-envoltorio">
        <table>
          <thead><tr><th>Categoría</th><th>Tickets</th><th>Estado</th><th><span class="solo-lectores">Acciones</span></th></tr></thead>
          <tbody>
            ${categorias.map(c => `
              <tr>
                <td><strong>${esc(c.name)}</strong></td>
                <td>${tickets.filter(t => t.category_id === c.id).length}</td>
                <td><span class="pastilla ${c.is_active ? "pastilla-activa" : "pastilla-inactiva"}">${c.is_active ? "Activa" : "Inactiva"}</span></td>
                <td><div class="acciones">
                  <button class="boton boton-secundario boton-pequeno" data-renombrar="${c.id}" data-nombre="${esc(c.name)}">Renombrar</button>
                  <button class="boton boton-secundario boton-pequeno" data-activar="${c.id}" data-activa="${c.is_active}">${c.is_active ? "Desactivar" : "Activar"}</button>
                </div></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <p class="subtexto">Las categorías no se borran para no dejar tickets antiguos sin categoría: se desactivan y dejan de salir al crear un ticket.</p>`;
  }

  formNueva.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarErrores(formNueva);
    const nombre = formNueva.elements.nombre;
    if (nombre.value.trim().length < 3) { marcarError(nombre, "Mínimo 3 caracteres."); return; }
    try {
      await api.categorias.crear(nombre.value);
      formNueva.reset();
      toast("ok", "Categoría creada.");
      pintar();
    } catch (err) {
      marcarError(nombre, err.message);
    }
  });

  // Diálogo para renombrar
  const dialogo = document.getElementById("dialogo-renombrar");
  const formRenombrar = document.getElementById("form-renombrar");
  document.getElementById("cancelar-renombrar").addEventListener("click", () => dialogo.close());

  document.getElementById("lista").addEventListener("click", async e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.renombrar) {
      limpiarErrores(formRenombrar);
      formRenombrar.dataset.id = b.dataset.renombrar;
      formRenombrar.elements.nombre.value = b.dataset.nombre;
      dialogo.showModal();
    }
    if (b.dataset.activar) {
      const activa = b.dataset.activa === "true";
      await api.categorias.actualizar(Number(b.dataset.activar), { is_active: !activa });
      toast("ok", activa ? "Categoría desactivada." : "Categoría activada.");
      pintar();
    }
  });
  formRenombrar.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarErrores(formRenombrar);
    const nombre = formRenombrar.elements.nombre;
    if (nombre.value.trim().length < 3) { marcarError(nombre, "Mínimo 3 caracteres."); return; }
    try {
      await api.categorias.actualizar(Number(formRenombrar.dataset.id), { name: nombre.value.trim() });
      dialogo.close();
      toast("ok", "Categoría renombrada.");
      pintar();
    } catch (err) {
      marcarError(nombre, err.message);
    }
  });

  await pintar();
});
