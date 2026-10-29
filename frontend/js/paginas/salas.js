// Catálogo: buscador, filtros por temática, dificultad y jugadores, y orden
iniciar(async () => {
  const salas = await api.salas.listar();
  montarPasillo(salas);   // el pasillo de puertas que avanza con el scroll (js/pasillo.js)
  const form = document.getElementById("filtros");
  const rejilla = document.getElementById("rejilla");
  const contador = document.getElementById("contador");

  // Solo ofrecemos las temáticas que tienen salas
  const tematicas = [...new Set(salas.map(s => s.theme))];
  document.getElementById("lista-tematicas").innerHTML = tematicas.map(t =>
    `<label class="casilla"><input type="checkbox" name="tema" value="${esc(t)}"> ${esc(t)}</label>`).join("");

  // Si llegamos con ?tema=Humor, lo marcamos
  const temaInicial = parametro("tema");
  form.querySelectorAll('[name="tema"]').forEach(c => { if (c.value === temaInicial) c.checked = true; });

  function pintar() {
    const datos = new FormData(form);
    const texto = datos.get("buscar").trim().toLowerCase();
    const temas = datos.getAll("tema");
    const dificultad = Number(datos.get("dificultad"));
    const jugadores = Number(datos.get("jugadores"));
    const orden = datos.get("orden");

    let lista = salas.filter(s =>
      (!texto || s.name.toLowerCase().includes(texto) || s.tagline.toLowerCase().includes(texto)) &&
      (!temas.length || temas.includes(s.theme)) &&
      (!dificultad || s.difficulty === dificultad) &&
      (!jugadores || (jugadores >= s.min_players && jugadores <= s.max_players)));

    const comparar = {
      nombre: (a, b) => a.name.localeCompare(b.name, "es"),
      precio: (a, b) => a.price_per_person - b.price_per_person,
      dificultad: (a, b) => a.difficulty - b.difficulty
    };
    lista.sort(comparar[orden]);

    contador.textContent = lista.length === 1 ? "1 sala" : `${lista.length} salas`;
    // Las tarjetas que se quedan se deslizan a su nuevo sitio con un muelle
    const antes = fotografiar(rejilla);
    rejilla.innerHTML = lista.length
      ? lista.map(tarjetaSala).join("")
      : `<div class="tarjeta vacio" style="grid-column:1/-1">Ninguna sala coincide con esos filtros. <button class="boton-enlace" type="reset" form="filtros">Quitar filtros</button></div>`;
    pintarIconos();
    animarCambios(rejilla, antes);
  }

  form.addEventListener("input", pintar);
  form.addEventListener("reset", () => setTimeout(pintar));
  form.addEventListener("submit", e => e.preventDefault());
  pintar();
});
