// Gestión de salas (admin): crear, editar, activar o desactivar y borrar
iniciar(async () => {
  const dialogo = document.getElementById("dialogo-sala");
  const form = document.getElementById("form-sala");
  form.elements.theme.innerHTML = TEMATICAS.map(t => `<option>${t}</option>`).join("");
  form.elements.difficulty.innerHTML = NIVELES.slice(1).map((n, i) => `<option value="${i + 1}">${i + 1} · ${n}</option>`).join("");
  let editando = null;

  async function pintar() {
    const salas = await api.salas.listar({ todas: true });
    document.getElementById("lista").innerHTML = `
      <div class="tabla-envoltorio">
        <table>
          <thead><tr><th>Sala</th><th>Temática</th><th>Dificultad</th><th>Duración</th><th>Jugadores</th><th>Precio</th><th>Estado</th><th><span class="solo-lectores">Acciones</span></th></tr></thead>
          <tbody>
            ${salas.map(s => `
              <tr>
                <td><strong>${esc(s.name)}</strong><div class="subtexto">/${esc(s.slug)}</div></td>
                <td>${esc(s.theme)}</td>
                <td>${puntosDificultad(s.difficulty)}</td>
                <td>${s.duration_min} min</td>
                <td>${s.min_players}-${s.max_players}</td>
                <td>${precio(s.price_per_person)}</td>
                <td><span class="pastilla ${s.is_active ? "pastilla-activa" : "pastilla-inactiva"}">${s.is_active ? "Activa" : "Inactiva"}</span></td>
                <td><div class="acciones">
                  <button class="boton boton-secundario boton-pequeno" data-editar="${s.id}">Editar</button>
                  <button class="boton boton-secundario boton-pequeno" data-activar="${s.id}">${s.is_active ? "Desactivar" : "Activar"}</button>
                  <button class="boton boton-peligro boton-pequeno" data-borrar="${s.id}" aria-label="Borrar ${esc(s.name)}">${icono("trash-2")}</button>
                </div></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    pintarIconos();
    return salas;
  }
  let salas = await pintar();

  function abrir(sala) {
    editando = sala;
    form.reset();
    limpiarErrores(form);
    document.getElementById("titulo-dialogo").textContent = sala ? "Editar sala" : "Nueva sala";
    if (sala) {
      for (const campo of ["name", "theme", "difficulty", "duration_min", "min_players", "max_players", "price_per_person", "min_age", "tagline", "description"]) {
        form.elements[campo].value = sala[campo] ?? "";
      }
      form.elements.is_active.checked = sala.is_active;
    }
    dialogo.showModal();
  }

  document.getElementById("nueva-sala").addEventListener("click", () => abrir(null));
  document.getElementById("cancelar-sala").addEventListener("click", () => dialogo.close());

  document.getElementById("lista").addEventListener("click", async e => {
    const b = e.target.closest("button");
    if (!b) return;
    const sala = salas.find(s => s.id === Number(b.dataset.editar || b.dataset.activar || b.dataset.borrar));
    if (b.dataset.editar) abrir(sala);
    if (b.dataset.activar) {
      await api.salas.actualizar(sala.id, { ...sala, is_active: !sala.is_active });
      toast("ok", sala.is_active ? "Sala desactivada: ya no sale en el catálogo." : "Sala activada.");
      salas = await pintar();
    }
    if (b.dataset.borrar) {
      if (!await confirmar("Borrar sala", `Vas a borrar "${sala.name}". No se puede deshacer.`, "Borrar", true)) return;
      try {
        await api.salas.borrar(sala.id);
        toast("ok", "Sala borrada.");
        salas = await pintar();
      } catch (err) {
        toast("error", err.message);
      }
    }
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarErrores(form);
    const f = form.elements;
    const datos = {
      name: f.name.value.trim(),
      theme: f.theme.value,
      difficulty: Number(f.difficulty.value),
      duration_min: Number(f.duration_min.value),
      min_players: Number(f.min_players.value),
      max_players: Number(f.max_players.value),
      price_per_person: Number(f.price_per_person.value),
      min_age: Number(f.min_age.value || 0),
      tagline: f.tagline.value.trim(),
      description: f.description.value.trim(),
      is_active: f.is_active.checked
    };
    // Las mismas reglas que los CHECK de la tabla rooms
    let valido = true;
    if (datos.name.length < 3) { marcarError(f.name, "Mínimo 3 caracteres."); valido = false; }
    if (!(datos.duration_min >= 15 && datos.duration_min <= 180)) { marcarError(f.duration_min, "Entre 15 y 180 minutos."); valido = false; }
    if (!(datos.min_players >= 1)) { marcarError(f.min_players, "Al menos 1."); valido = false; }
    if (!(datos.max_players >= datos.min_players)) { marcarError(f.max_players, "No puede ser menor que el mínimo."); valido = false; }
    if (!(datos.price_per_person >= 0) || f.price_per_person.value === "") { marcarError(f.price_per_person, "Escribe un precio."); valido = false; }
    if (!(datos.min_age >= 0 && datos.min_age <= 99)) { marcarError(f.min_age, "Entre 0 y 99."); valido = false; }
    if (datos.description.length < 20) { marcarError(f.description, "Mínimo 20 caracteres."); valido = false; }
    if (!valido) return;

    try {
      if (editando) await api.salas.actualizar(editando.id, datos);
      else await api.salas.crear(datos);
      dialogo.close();
      toast("ok", editando ? "Sala guardada." : "Sala creada.");
      salas = await pintar();
    } catch (err) {
      marcarError(f.name, err.message);
    }
  });
});
