/* =====================================================================
   El pasillo (página de Salas).
   Cada sala es una puerta en un pasillo a oscuras. Al bajar con el
   scroll, el pasillo avanza hacia la derecha; la puerta que tienes
   delante se enciende con un parpadeo de fluorescente y las demás se
   quedan en penumbra.
   - Escritorio: la escena se queda fija y el scroll vertical la mueve
     en horizontal.
   - Móvil, táctil o "menos movimiento": es un carrusel normal que se
     desliza con el dedo (scroll-snap), con el mismo efecto de luz.
   ===================================================================== */

function montarPasillo(salas) {
  const seccion = document.getElementById("pasillo");
  if (!seccion || !salas.length) return;
  const pista = document.getElementById("pasillo-pista");
  const contador = document.getElementById("pasillo-contador");
  const barra = seccion.querySelector(".pasillo-barra span");
  const n = salas.length;
  const nivel = ["", "Iniciación", "Fácil", "Media", "Difícil", "Experto"];

  pista.innerHTML = salas.map((s, i) => `
    <article class="puerta" aria-label="${esc(s.name)}">
      <a class="puerta-foto" href="sala.html?slug=${encodeURIComponent(s.slug)}" tabindex="-1" aria-hidden="true">
        <img src="${esc(fotoSala(s))}" alt="" decoding="async"${i > 1 ? ' loading="lazy"' : ""}>
      </a>
      <div class="puerta-texto">
        <span class="puerta-numero" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <span class="etiqueta-superior">${esc(s.theme)} · ${s.duration_min} min · ${s.min_players}-${s.max_players} jugadores${s.min_age ? ` · +${s.min_age}` : ""}</span>
        <h2>${esc(s.name)}</h2>
        <p>${esc(s.tagline)}</p>
        <div class="puerta-pie">
          <span class="puerta-nivel" title="Dificultad">${"▮".repeat(s.difficulty)}<i>${"▮".repeat(5 - s.difficulty)}</i> ${nivel[s.difficulty]}</span>
          <a class="boton boton-primario" href="sala.html?slug=${encodeURIComponent(s.slug)}">Abrir esta puerta</a>
        </div>
      </div>
    </article>`).join("");
  const puertas = [...pista.children];

  const fijo = !matchMedia("(prefers-reduced-motion: reduce)").matches && matchMedia("(pointer: fine) and (min-width: 900px)").matches;
  seccion.classList.add(fijo ? "pasillo-fijo" : "pasillo-libre");
  let activa = -1, frame = null, objetivo = 0, actual = 0;

  // Luz de cada puerta según lo cerca que esté del centro de la pantalla
  function iluminar() {
    const centro = innerWidth / 2;
    let mejor = 0, mejorD = Infinity;
    puertas.forEach((p, i) => {
      const caja = p.getBoundingClientRect();
      const d = (caja.left + caja.width / 2 - centro) / (caja.width * 0.9);   // -1..1 aprox.
      const luz = Math.max(0, 1 - Math.abs(d));
      p.style.setProperty("--luz", luz.toFixed(3));
      p.style.setProperty("--desplazar", `${(-d * 6).toFixed(2)}%`);
      if (Math.abs(d) < mejorD) { mejorD = Math.abs(d); mejor = i; }
    });
    if (mejor !== activa) {
      puertas[activa]?.classList.remove("encendida");
      activa = mejor;
      puertas[activa].classList.add("encendida");
      contador.textContent = `${String(activa + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
    }
  }

  if (fijo) {
    // Alto de la sección = lo que hay que mover el pasillo para que la última puerta quede en el centro
    const medir = () => {
      const ultima = puertas[n - 1];
      const sobra = ultima.offsetLeft + ultima.offsetWidth / 2 - innerWidth / 2 - (puertas[0].offsetLeft + puertas[0].offsetWidth / 2 - innerWidth / 2);
      seccion.style.setProperty("--pasillo-alto", `${innerHeight + Math.max(0, sobra)}px`);
      return sobra;
    };
    let sobra = medir();
    const progreso = () => {
      const recorrido = seccion.offsetHeight - innerHeight;
      return recorrido > 0 ? Math.min(1, Math.max(0, -seccion.getBoundingClientRect().top / recorrido)) : 0;
    };
    function bucle() {
      actual += (objetivo - actual) * 0.12;
      if (Math.abs(objetivo - actual) < 0.0005) actual = objetivo;
      pista.style.transform = `translate3d(${(-actual * sobra).toFixed(1)}px, 0, 0)`;
      barra.style.transform = `scaleX(${actual.toFixed(4)})`;
      iluminar();
      frame = actual === objetivo ? null : requestAnimationFrame(bucle);
    }
    const mover = () => { objetivo = progreso(); if (!frame) frame = requestAnimationFrame(bucle); };
    addEventListener("scroll", mover, { passive: true });
    addEventListener("resize", () => { sobra = medir(); mover(); });
    // Con teclado: al enfocar el botón de una puerta, el scroll la trae al centro
    pista.addEventListener("focusin", e => {
      const i = puertas.indexOf(e.target.closest(".puerta"));
      if (i < 0) return;
      const recorrido = seccion.offsetHeight - innerHeight;
      scrollTo({ top: seccion.offsetTop + recorrido * (n > 1 ? i / (n - 1) : 0) });
    });
    objetivo = actual = progreso();
    bucle();
  } else {
    const alMover = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        iluminar();
        const max = pista.scrollWidth - pista.clientWidth;
        barra.style.transform = `scaleX(${max > 0 ? (pista.scrollLeft / max).toFixed(4) : 0})`;
      });
    };
    pista.addEventListener("scroll", alMover, { passive: true });
    addEventListener("resize", alMover);
    iluminar();
  }
}
