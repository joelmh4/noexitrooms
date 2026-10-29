/* =====================================================================
   Escenas de la portada (debajo de la linterna)
   1) Manifiesto: la frase se va iluminando palabra a palabra al bajar.
   2) Medidor de miedo: una palanca de 1 a 5 que recomienda una sala.
   ===================================================================== */

const MENOS_MOVIMIENTO_ESCENAS = matchMedia("(prefers-reduced-motion: reduce)").matches;

function montarManifiesto() {
  const seccion = document.getElementById("manifiesto");
  if (!seccion) return;
  const texto = seccion.querySelector(".manifiesto-texto");
  if (MENOS_MOVIMIENTO_ESCENAS) { seccion.classList.add("manifiesto-estatico"); return; }

  // Cada palabra en su <span>; el lector de pantalla lee la frase entera
  const frase = texto.textContent.trim();
  texto.setAttribute("aria-label", frase);
  texto.innerHTML = frase.split(" ").map(p => `<span aria-hidden="true">${esc(p)}</span>`).join(" ");
  const palabras = [...texto.children];
  const fondo = seccion.querySelector(".manifiesto-fondo");
  let frame = null;

  function pintar() {
    frame = null;
    const caja = seccion.getBoundingClientRect();
    // 0 cuando la sección entra por abajo, 1 cuando su centro pasa por arriba del centro
    const t = Math.min(1, Math.max(0, (innerHeight - caja.top) / (innerHeight * 0.55 + caja.height * 0.5)));
    const encendidas = t * (palabras.length + 3);
    palabras.forEach((p, i) => p.style.opacity = (0.12 + 0.88 * Math.min(1, Math.max(0, encendidas - i))).toFixed(3));
    fondo.style.opacity = (0.15 + 0.45 * t).toFixed(3);
    fondo.style.transform = `scale(${(1.15 - 0.1 * t).toFixed(4)})`;
  }
  addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(pintar); }, { passive: true });
  addEventListener("resize", pintar);
  pintar();
}

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
