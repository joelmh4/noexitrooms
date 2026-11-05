/* =====================================================================
   Medidor de miedo de la portada: una palanca de 1 a 5 (un <input type="range">)
   que recomienda la sala con la dificultad más parecida.
   ===================================================================== */

function montarMedidor(salas) {
  const palanca = document.getElementById("nivel-miedo");
  if (!palanca || !salas.length) return;
  const enlace = document.getElementById("medidor-sala");
  const foto = document.getElementById("medidor-foto");
  const info = document.getElementById("medidor-info");
  const nombres = ["Nada", "Un poco", "Lo justo", "Mucho", "Sin límite"];
  let actual = null;

  // La sala con la dificultad más cercana (si empatan, la de más dificultad)
  function elegir(nivel) {
    return [...salas].sort((a, b) =>
      Math.abs(a.difficulty - nivel) - Math.abs(b.difficulty - nivel) || b.difficulty - a.difficulty)[0];
  }

  function pintar() {
    const nivel = Number(palanca.value);
    palanca.setAttribute("aria-valuetext", nombres[nivel - 1]);
    palanca.style.setProperty("--relleno", `${(nivel - 1) * 25}%`);
    enlace.dataset.nivel = nivel;
    const s = elegir(nivel);
    if (s === actual) return;
    actual = s;
    enlace.href = `sala.html?slug=${encodeURIComponent(s.slug)}`;
    enlace.classList.remove("cambiando");
    void enlace.offsetWidth;                    // reinicia la animación de parpadeo
    enlace.classList.add("cambiando");
    foto.src = fotoSala(s);
    info.innerHTML = `
      <span class="etiqueta-superior">${esc(s.theme)} · ${s.duration_min} min${s.min_age ? ` · +${s.min_age}` : ""}</span>
      <span class="medidor-nombre">${esc(s.name)}</span>
      <span class="medidor-lema">${esc(s.tagline)}</span>
      <span class="medidor-ir">Abrir esta puerta →</span>`;
  }
  palanca.addEventListener("input", pintar);
  pintar();
}
