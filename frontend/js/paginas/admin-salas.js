const CAMPOS_SALA = ["name", "theme", "difficulty", "duration_min", "min_players", "max_players", "price_per_person", "min_age", "tagline", "challenges", "description"];

iniciar(async () => {
  const dialogo = document.getElementById("dialogo-sala");
  const form = document.getElementById("form-sala");
  const f = form.elements;
  f.theme.innerHTML = opciones(TEMATICAS.map(t => [t, t]));
  f.difficulty.innerHTML = opciones(NIVELES.slice(1).map((n, i) => [i + 1, `${i + 1} · ${n}`]));
  let editando = null;
  let salas = [];

  async function pintar() {
    salas = await api.salas.listar({ todas: true });
    document.getElementById("lista").innerHTML = tabla(
      ["Sala", "Temática", "Dificultad", "Duración", "Jugadores", "Precio", "Estado", COLUMNA_ACCIONES],
      salas.map(s => `
        <tr>
          <td data-etiqueta="Sala" class="celda-principal"><strong>${esc(s.name)}</strong><div class="subtexto">/${esc(s.slug)}</div></td>
          <td data-etiqueta="Temática">${esc(s.theme)}</td>
          <td data-etiqueta="Dificultad">${puntosDificultad(s.difficulty)}</td>
          <td data-etiqueta="Duración">${s.duration_min} min</td>
          <td data-etiqueta="Jugadores">${s.min_players}-${s.max_players}</td>
          <td data-etiqueta="Precio">${precio(s.price_per_person)}</td>
          <td data-etiqueta="Estado">${pastilla(s.is_active, s.is_active ? "Activa" : "Inactiva")}</td>
          <td class="celda-acciones"><div class="acciones">
            <button class="boton boton-secundario boton-pequeno" data-editar="${s.id}">Editar</button>
            <button class="boton boton-secundario boton-pequeno" data-activar="${s.id}">${s.is_active ? "Desactivar" : "Activar"}</button>
            <button class="boton boton-peligro boton-pequeno" data-borrar="${s.id}" aria-label="Borrar ${esc(s.name)}">${icono("trash-2")}</button>
          </div></td>
        </tr>`).join(""));
    pintarIconos();
  }

  function abrir(sala) {
    editando = sala;
    form.reset();
    limpiarErrores(form);
    document.getElementById("titulo-dialogo").textContent = sala ? "Editar sala" : "Nueva sala";
    if (sala) {
      for (const campo of CAMPOS_SALA) f[campo].value = sala[campo] ?? "";
      f.is_active.checked = sala.is_active;
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
      if (!await accion(b, () => api.salas.actualizar(sala.id, { ...sala, is_active: !sala.is_active }))) return;
      toast("ok", sala.is_active ? "Sala desactivada: ya no sale en el catálogo." : "Sala activada.");
      await pintar();
    }
    if (b.dataset.borrar) {
      if (!await confirmar("Borrar sala", `Vas a borrar "${sala.name}". No se puede deshacer.`, "Borrar", true)) return;
      if (!await accion(null, () => api.salas.borrar(sala.id))) return;
      toast("ok", "Sala borrada.");
      await pintar();
    }
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
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
      challenges: f.challenges.value.trim(),
      is_active: f.is_active.checked
    };
    if (!validar(form, [
      [datos.name.length < 3, f.name, "Mínimo 3 caracteres."],
      [!(datos.duration_min >= 15 && datos.duration_min <= 180), f.duration_min, "Entre 15 y 180 minutos."],
      [!(datos.min_players >= 1), f.min_players, "Al menos 1."],
      [!(datos.max_players >= datos.min_players), f.max_players, "No puede ser menor que el mínimo."],
      [!(datos.price_per_person >= 0) || f.price_per_person.value === "", f.price_per_person, "Escribe un precio."],
      [!(datos.min_age >= 0 && datos.min_age <= 99), f.min_age, "Entre 0 y 99."],
      [datos.description.length < 20, f.description, "Mínimo 20 caracteres."]
    ])) return;

    try {
      if (editando) await api.salas.actualizar(editando.id, datos);
      else await api.salas.crear(datos);
      dialogo.close();
      toast("ok", editando ? "Sala guardada." : "Sala creada.");
      await pintar();
    } catch (err) {
      marcarError(f.name, err.message);
    }
  });

  await pintar();
});
