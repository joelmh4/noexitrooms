iniciar(async () => {
  const formNueva = document.getElementById("form-nueva");
  const dialogo = document.getElementById("dialogo-renombrar");
  const formRenombrar = document.getElementById("form-renombrar");
  const tickets = await api.tickets.listar();
  const nombreValido = (form, campo) => validar(form, [[campo.value.trim().length < 3, campo, "Mínimo 3 caracteres."]]);

  async function pintar() {
    const categorias = await api.categorias.listar({ todas: true });
    document.getElementById("lista").innerHTML = tabla(
      ["Categoría", "Tickets", "Estado", COLUMNA_ACCIONES],
      categorias.map(c => `
        <tr>
          <td data-etiqueta="Categoría" class="celda-principal"><strong>${esc(c.name)}</strong></td>
          <td data-etiqueta="Tickets">${tickets.filter(t => t.category_id === c.id).length}</td>
          <td data-etiqueta="Estado">${pastilla(c.is_active, c.is_active ? "Activa" : "Inactiva")}</td>
          <td class="celda-acciones"><div class="acciones">
            <button class="boton boton-secundario boton-pequeno" data-renombrar="${c.id}" data-nombre="${esc(c.name)}">Renombrar</button>
            <button class="boton boton-secundario boton-pequeno" data-activar="${c.id}" data-activa="${c.is_active}">${c.is_active ? "Desactivar" : "Activar"}</button>
          </div></td>
        </tr>`).join("")) +
      `<p class="subtexto">Las categorías no se borran para no dejar tickets antiguos sin categoría: se desactivan y dejan de salir al crear un ticket.</p>`;
  }

  formNueva.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre = formNueva.elements.nombre;
    if (!nombreValido(formNueva, nombre)) return;
    try {
      await api.categorias.crear(nombre.value);
      formNueva.reset();
      toast("ok", "Categoría creada.");
      pintar();
    } catch (err) {
      marcarError(nombre, err.message);
    }
  });

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
      if (!await accion(b, () => api.categorias.actualizar(Number(b.dataset.activar), { is_active: !activa }))) return;
      toast("ok", activa ? "Categoría desactivada." : "Categoría activada.");
      pintar();
    }
  });

  formRenombrar.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre = formRenombrar.elements.nombre;
    if (!nombreValido(formRenombrar, nombre)) return;
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
