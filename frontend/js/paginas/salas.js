const ORDENES = {
  nombre: (a, b) => a.name.localeCompare(b.name, "es"),
  precio: (a, b) => a.price_per_person - b.price_per_person,
  dificultad: (a, b) => a.difficulty - b.difficulty
};

iniciar(async () => {
  const salas = await api.salas.listar();
  const form = document.getElementById("filtros");
  const rejilla = document.getElementById("rejilla");
  const contador = document.getElementById("contador");

  const tematicas = [...new Set(salas.map(s => s.theme))];
  document.getElementById("lista-tematicas").innerHTML = tematicas.map(t =>
    `<label class="chip-tema ${claseFondo(t)}"><input type="checkbox" name="tema" value="${esc(t)}"><span>${esc(t)}</span></label>`).join("");

  const temaInicial = parametro("tema");
  form.querySelectorAll('[name="tema"]').forEach(c => { if (c.value === temaInicial) c.checked = true; });

  function pintar() {
    const datos = new FormData(form);
    const texto = datos.get("buscar").trim().toLowerCase();
    const temas = datos.getAll("tema");
    const dificultad = Number(datos.get("dificultad"));
    const jugadores = Number(datos.get("jugadores"));

    const lista = salas.filter(s =>
      (!texto || s.name.toLowerCase().includes(texto) || s.tagline.toLowerCase().includes(texto)) &&
      (!temas.length || temas.includes(s.theme)) &&
      (!dificultad || s.difficulty === dificultad) &&
      (!jugadores || (jugadores >= s.min_players && jugadores <= s.max_players)))
      .sort(ORDENES[datos.get("orden")]);

    contador.textContent = lista.length === 1 ? "1 sala" : `${lista.length} salas`;
    rejilla.innerHTML = lista.length
      ? lista.map(tarjetaSala).join("")
      : `<div class="tarjeta vacio" style="grid-column:1/-1">Ninguna sala coincide con esos filtros. <button class="boton-enlace" type="reset" form="filtros">Quitar filtros</button></div>`;
    pintarIconos();
  }

  form.addEventListener("input", pintar);
  form.addEventListener("reset", () => setTimeout(pintar));
  form.addEventListener("submit", e => e.preventDefault());
  pintar();
});
