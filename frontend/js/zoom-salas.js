/* =====================================================================
   Todas las salas en la portada, con zoom.
   Al pulsar una pieza la foto crece desde su sitio hasta el centro (como
   el zoom de la app Fotos) en vez de abrir la ficha. Se cierra pulsando,
   con Escape o arrastrándola hacia abajo, y vuelve a su hueco.
   Usa los muelles y el arrastre de js/movimiento.js.
   ===================================================================== */

/* ---------- Mosaico de la portada ---------- */
// Cada sala es una pieza; al pulsarla la foto crece desde su sitio (no abre la ficha).
function montarMosaico(salas) {
  const mosaico = document.getElementById("mosaico");
  if (!mosaico || !salas.length) return;
  mosaico.innerHTML = salas.map((s, i) => `
    <button class="pieza-sala ${claseFondo(s.theme)}" type="button" data-indice="${i}" aria-label="Ampliar ${esc(s.name)}">
      <img src="${esc(fotoSala(s))}" alt="" ${QUITAR_SI_FALTA}>
      <span class="pieza-nombre">${esc(s.name)}</span>
    </button>`).join("");
  mosaico.addEventListener("click", e => {
    const pieza = e.target.closest(".pieza-sala");
    if (pieza) ampliarSala(pieza, salas[pieza.dataset.indice]);
  });
}

// Zoom con un muelle sobre el progreso (0 = en el mosaico, 1 = ampliada).
// Se puede cerrar a mitad de abrirse y viceversa: el muelle parte de donde esté.
function ampliarSala(pieza, sala) {
  const capa = document.createElement("div");
  capa.className = "zoom-sala";
  capa.setAttribute("role", "dialog");
  capa.setAttribute("aria-modal", "true");
  capa.setAttribute("aria-label", sala.name);
  capa.innerHTML = `
    <div class="zoom-fondo"></div>
    <figure class="zoom-foto ${claseFondo(sala.theme)}">
      <img src="${esc(fotoSala(sala))}" alt="${esc(sala.name)}" ${QUITAR_SI_FALTA}>
      <figcaption>
        <span class="tema-tag">${esc(sala.theme)}</span>
        <strong>${esc(sala.name)}</strong>
        <span>${esc(sala.tagline || "")}</span>
        <span class="zoom-datos">${sala.duration_min} min · ${sala.min_players}-${sala.max_players} jugadores · ${sala.price_per_person} € / persona</span>
        <a class="boton boton-primario boton-pequeno" href="sala.html?slug=${encodeURIComponent(sala.slug)}">Ver la sala</a>
      </figcaption>
      <button class="zoom-cerrar" type="button" aria-label="Cerrar"><i data-lucide="x"></i></button>
    </figure>`;
  document.body.append(capa);
  pintarIconos();
  const fondo = capa.querySelector(".zoom-fondo");
  const foto = capa.querySelector(".zoom-foto");
  const textos = capa.querySelector("figcaption");

  // Destino: centrada, 3:2, lo más grande que quepa
  const ancho = Math.min(innerWidth - 32, (innerHeight - 64) * 1.5, 1100);
  const destino = { left: (innerWidth - ancho) / 2, top: (innerHeight - ancho / 1.5) / 2, width: ancho, height: ancho / 1.5 };
  Object.assign(foto.style, { left: destino.left + "px", top: destino.top + "px", width: destino.width + "px", height: destino.height + "px" });

  let arrastre = 0;
  let cerrando = false;
  let huboArrastre = false;
  pieza.style.visibility = "hidden";
  document.documentElement.classList.add("sin-scroll");

  const pintar = p => {
    const origen = pieza.getBoundingClientRect();
    const sx = origen.width / destino.width, sy = origen.height / destino.height;
    const x = (origen.left - destino.left) * (1 - p);
    const y = (origen.top - destino.top) * (1 - p) + arrastre;
    const escX = sx + (1 - sx) * p, escY = sy + (1 - sy) * p;
    foto.style.transform = `translate(${x}px, ${y}px) scale(${escX}, ${escY})`;
    foto.style.borderRadius = `${16 / escX}px / ${16 / escY}px`;
    fondo.style.opacity = Math.max(0, Math.min(1, p));
    textos.style.opacity = Math.max(0, (p - 0.6) / 0.4);
  };
  const muelle = crearMuelle(0, pintar, MUELLE);
  pintar(0);
  muelle.ir(1);

  const cerrar = (velocidad = 0) => {
    if (cerrando) return;
    cerrando = true;
    muelle.ir(0, {
      velocidad,
      terminar: () => {
        pieza.style.visibility = "";
        document.documentElement.classList.remove("sin-scroll");
        document.removeEventListener("keydown", teclas);
        capa.remove();
        pieza.focus({ preventScroll: true });
      }
    });
  };
  // Pulsar otra vez (o fuera) la devuelve a su sitio, igual que el zoom de Fotos
  capa.addEventListener("click", e => {
    if (huboArrastre) { huboArrastre = false; return; }  // el clic que sigue a un arrastre no cuenta
    if (!e.target.closest("a")) cerrar();
  });
  const teclas = e => { if (e.key === "Escape") cerrar(); };
  document.addEventListener("keydown", teclas);
  capa.querySelector(".zoom-cerrar").focus({ preventScroll: true });

  // Arrastrar hacia abajo la va soltando; si el gesto lleva impulso, se cierra
  arrastrable(foto, {
    eje: "y",
    alEmpezar: () => { huboArrastre = true; },
    alMover: d => {
      arrastre = d > 0 ? d : goma(d, innerHeight);
      muelle.fijar(Math.max(0.4, 1 - Math.max(0, d) / 600));
    },
    alSoltar: v => {
      const final = arrastre + proyectar(v);
      if (final > 160) {
        const desde = arrastre;
        const caida = crearMuelle(desde, val => { arrastre = val; }, MUELLE);
        caida.ir(0);
        cerrar(-Math.max(v, 0) / 600);
      } else {
        const vuelta = crearMuelle(arrastre, val => { arrastre = val; pintar(muelle.valor); }, MUELLE_CAJON);
        vuelta.ir(0, { velocidad: v });
        muelle.ir(1);
      }
    }
  });
}
