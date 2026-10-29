// Ficha de sala: /sala.html?slug=...
// Ambientación propia (js/ambiente.js), galería a oscuras con linterna y reserva con calendario
iniciar(async () => {
  let sala;
  try {
    sala = await api.salas.obtener(parametro("slug"));
  } catch (err) {
    if (err.status === 404) { location.replace("404.html"); return; }
    throw err;
  }
  document.title = `${sala.name} · NoExitRooms`;
  const esParodia = sala.description.includes("caricaturizados");
  const fotos = fotosGaleria(sala);

  document.getElementById("ficha").innerHTML = `
    <nav class="migas" aria-label="Migas de pan"><a href="salas.html">Salas</a> / ${esc(sala.name)}</nav>
    <div class="ficha-cabecera ${claseFondo(sala.theme)}"><img class="foto-sala" src="${esc(fotoSala(sala))}" alt="" ${QUITAR_SI_FALTA}><span class="tema-tag">${esc(sala.theme)}</span></div>
    <div class="ficha">
      <div class="ficha-texto">
        <h1>${esc(sala.name)}</h1>
        <p class="lema">${esc(sala.tagline)}</p>
        <p>${esc(sala.description)}</p>
        <div id="ambiente"></div>
        ${sala.pruebas?.length ? `
          <h2 style="font-size:1.3rem;margin-top:16px">Lo que os espera</h2>
          <ul class="lista-pruebas">${sala.pruebas.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
        <div class="galeria-sala" id="galeria">
          ${fotos.map((src, i) => `
            <button type="button" class="galeria-foto" data-foto="${i}" aria-label="Ver la foto ${i + 1} a pantalla completa">
              <img src="${esc(src)}" alt="${esc(sala.name)}: foto ${i + 1} de la sala" loading="lazy" onerror="this.parentElement.remove()">
            </button>`).join("")}
        </div>
        ${esParodia ? aviso("info", "Sala de humor. Los personajes son caricaturas y la historia es ficticia.") : ""}
        ${sala.min_age >= 18 ? aviso("aviso", "Solo mayores de 18 años. Se pide el DNI en recepción.") : ""}
      </div>
      <aside class="tarjeta ficha-datos">
        <p class="tarjeta-titulo">Datos de la sala</p>
        <dl>
          <dt>Temática</dt><dd>${esc(sala.theme)}</dd>
          <dt>Dificultad</dt><dd>${puntosDificultad(sala.difficulty)} ${NIVELES[sala.difficulty]}</dd>
          <dt>Duración</dt><dd>${sala.duration_min} min</dd>
          <dt>Jugadores</dt><dd>${sala.min_players} a ${sala.max_players}</dd>
          <dt>Edad mínima</dt><dd>${sala.min_age ? sala.min_age + " años" : "Todas las edades"}</dd>
          <dt>Precio</dt><dd class="precio">${precio(sala.price_per_person)} / persona</dd>
        </dl>
        <a class="boton boton-primario boton-bloque" href="#reservar">${icono("calendar")} Reservar</a>
        <a class="boton boton-secundario boton-bloque" href="nuevo-ticket.html?sala=${encodeURIComponent(sala.slug)}">${icono("message-square")} Preguntar algo</a>
      </aside>
    </div>
    <section class="reserva" id="reservar" aria-labelledby="titulo-reserva"></section>`;

  montarAmbiente(document.getElementById("ambiente"), sala);
  montarGaleria(sala, fotos);
  montarReserva(sala);
  pintarIconos();
});

/* ---------- Galería: a oscuras, la linterna sigue al ratón; al pulsar, pantalla completa ---------- */
function montarGaleria(sala, fotos) {
  const galeria = document.getElementById("galeria");
  if (!galeria || !fotos.length) return;
  galeria.addEventListener("pointermove", e => {
    const b = e.target.closest(".galeria-foto");
    if (!b) return;
    const c = b.getBoundingClientRect();
    b.style.setProperty("--mx", `${e.clientX - c.left}px`);
    b.style.setProperty("--my", `${e.clientY - c.top}px`);
  });

  const visor = document.createElement("dialog");
  visor.className = "visor";
  visor.setAttribute("aria-label", `Fotos de ${sala.name}`);
  visor.innerHTML = `
    <img alt="">
    <p class="visor-pie"></p>
    <button type="button" class="visor-boton visor-cerrar" aria-label="Cerrar">${icono("x")}</button>
    <button type="button" class="visor-boton visor-anterior" aria-label="Foto anterior">${icono("chevron-left")}</button>
    <button type="button" class="visor-boton visor-siguiente" aria-label="Foto siguiente">${icono("chevron-right")}</button>`;
  document.body.append(visor);
  const img = visor.querySelector("img"), pie = visor.querySelector(".visor-pie");
  let actual = 0;

  function mostrar(i) {
    const visibles = [...galeria.querySelectorAll(".galeria-foto img")];   // las que existen de verdad
    if (!visibles.length) return;
    actual = (i + visibles.length) % visibles.length;
    img.src = visibles[actual].src;
    img.alt = visibles[actual].alt;
    pie.textContent = `${actual + 1} / ${visibles.length}`;
    img.classList.remove("entrando"); void img.offsetWidth; img.classList.add("entrando");
  }
  galeria.addEventListener("click", e => {
    const b = e.target.closest(".galeria-foto");
    if (!b) return;
    mostrar([...galeria.querySelectorAll(".galeria-foto")].indexOf(b));
    visor.showModal();
  });
  visor.querySelector(".visor-cerrar").addEventListener("click", () => visor.close());
  visor.querySelector(".visor-anterior").addEventListener("click", () => mostrar(actual - 1));
  visor.querySelector(".visor-siguiente").addEventListener("click", () => mostrar(actual + 1));
  visor.addEventListener("click", e => { if (e.target === visor) visor.close(); });   // clic fuera de la foto
  visor.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") mostrar(actual - 1);
    if (e.key === "ArrowRight") mostrar(actual + 1);
  });
  // Deslizar con el dedo
  let inicioX = null;
  visor.addEventListener("pointerdown", e => { inicioX = e.clientX; });
  visor.addEventListener("pointerup", e => {
    if (inicioX === null) return;
    const d = e.clientX - inicioX;
    if (Math.abs(d) > 50) mostrar(actual + (d < 0 ? 1 : -1));
    inicioX = null;
  });
}

/* ---------- Reserva con calendario ---------- */
function montarReserva(sala) {
  const caja = document.getElementById("reservar");
  const yo = api.auth.usuarioActual();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  let semana = 0, elegido = null, jugadores = Math.min(sala.max_players, Math.max(sala.min_players, 4)), mensaje = "";
  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const deIso = f => new Date(f + "T00:00:00");
  const textoDia = f => { const d = deIso(f); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
  const textoLargo = s => {
    const d = new Date(s);
    return `${d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a las ${s.slice(11, 16)}`;
  };

  async function pintar() {
    const desde = new Date(hoy); desde.setDate(desde.getDate() + semana * 7);
    const dias = await api.reservas.huecos(sala.id, iso(desde), 7);
    const hasta = deIso(dias[6].fecha);
    caja.innerHTML = `
      <div class="reserva-cabecera">
        <div class="pila" style="gap:6px">
          <span class="etiqueta-superior">Reserva online</span>
          <h2 id="titulo-reserva">Elegid día y hora</h2>
        </div>
        <div class="reserva-semana">
          <button type="button" class="boton boton-secundario boton-pequeno" data-semana="-1" ${semana === 0 ? "disabled" : ""} aria-label="Semana anterior">${icono("chevron-left")}</button>
          <span aria-live="polite">${desde.getDate()} ${MESES[desde.getMonth()]} – ${hasta.getDate()} ${MESES[hasta.getMonth()]}</span>
          <button type="button" class="boton boton-secundario boton-pequeno" data-semana="1" ${semana >= 7 ? "disabled" : ""} aria-label="Semana siguiente">${icono("chevron-right")}</button>
        </div>
      </div>
      <div class="calendario">
        ${dias.map(d => `
          <div class="calendario-dia">
            <p class="calendario-fecha">${textoDia(d.fecha)}</p>
            ${d.horas.map(h => {
              const libre = h.estado === "libre";
              const marcado = elegido === h.starts_at;
              const etiqueta = { libre: "libre", ocupada: "ocupada", tuya: "reservada por ti", pasada: "ya ha pasado" }[h.estado];
              return `<button type="button" class="hueco hueco-${h.estado}" data-hueco="${h.starts_at}" ${libre ? "" : "disabled"} aria-pressed="${marcado}" aria-label="${textoDia(d.fecha)}, ${h.hora}: ${etiqueta}">${h.hora}</button>`;
            }).join("")}
          </div>`).join("")}
      </div>
      <ul class="calendario-leyenda" aria-hidden="true">
        <li><span class="hueco-muestra hueco-libre"></span>Libre</li>
        <li><span class="hueco-muestra hueco-ocupada"></span>Ocupada</li>
        <li><span class="hueco-muestra hueco-tuya"></span>Tuya</li>
      </ul>
      <div class="reserva-resumen tarjeta">${resumen()}</div>
      ${mensaje}`;
    pintarIconos();
  }

  function resumen() {
    if (!elegido) return `<p class="texto-suave">Elegid un hueco libre en el calendario.</p>`;
    const accion = !yo
      ? `<a class="boton boton-primario" href="login.html?volver=${encodeURIComponent(`sala.html?slug=${sala.slug}#reservar`)}">Inicia sesión para reservar</a>`
      : yo.role !== "cliente"
        ? `<p class="texto-suave">Las reservas las hacen los clientes. Entra con una cuenta de cliente para probarlo.</p>`
        : `<button type="button" class="boton boton-primario" data-confirmar>Reservar por ${precio(jugadores * sala.price_per_person)}</button>`;
    return `
      <div class="resumen-hueco"><span class="etiqueta-superior">Vuestra sesión</span><b>${esc(textoLargo(elegido))}</b></div>
      <div class="resumen-jugadores" role="group" aria-label="Número de jugadores">
        <button type="button" class="boton boton-secundario boton-pequeno" data-jugadores="-1" ${jugadores <= sala.min_players ? "disabled" : ""} aria-label="Un jugador menos">−</button>
        <span><b>${jugadores}</b> jugadores</span>
        <button type="button" class="boton boton-secundario boton-pequeno" data-jugadores="1" ${jugadores >= sala.max_players ? "disabled" : ""} aria-label="Un jugador más">+</button>
      </div>
      ${accion}`;
  }

  caja.addEventListener("click", async e => {
    const boton = e.target.closest("button");
    if (!boton || boton.disabled) return;
    if (boton.dataset.semana) { semana += Number(boton.dataset.semana); elegido = null; mensaje = ""; return pintar(); }
    if (boton.dataset.hueco) { elegido = boton.dataset.hueco; mensaje = ""; await pintar(); caja.querySelector(`[data-hueco="${elegido}"]`)?.focus(); return; }
    if (boton.dataset.jugadores) {
      jugadores += Number(boton.dataset.jugadores);
      caja.querySelector(".reserva-resumen").innerHTML = resumen();
      caja.querySelector(`[data-jugadores="${boton.dataset.jugadores}"]`)?.focus();
      return;
    }
    if (boton.hasAttribute("data-confirmar")) {
      boton.disabled = true;
      try {
        await api.reservas.crear({ room_id: sala.id, starts_at: elegido, players: jugadores });
        mensaje = aviso("ok", `Reserva hecha: ${textoLargo(elegido)}, ${jugadores} jugadores. Queda pendiente hasta que la confirmemos (la verás en Mis tickets).`);
        elegido = null;
      } catch (err) {
        mensaje = aviso("error", err.message);
        if (err.status === 409) elegido = null;
      }
      await pintar();
      caja.querySelector(".aviso")?.scrollIntoView({ block: "nearest" });
    }
  });
  pintar();
}
