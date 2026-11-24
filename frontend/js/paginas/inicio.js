iniciar(async () => {
  montarReloj();
  montarRevelado();
  const salas = await api.salas.listar();
  document.getElementById("destacadas").innerHTML = salas.slice(0, 3).map(tarjetaSala).join("");
  montarFoco();
  montarMedidor(salas);
});

function montarReloj() {
  const reloj = document.getElementById("reloj-portada");
  if (!reloj) return;
  let segundos = 60 * 60;
  let intervalo = null;
  const pintar = () => {
    const m = String(Math.floor(segundos / 60)).padStart(2, "0");
    const s = String(segundos % 60).padStart(2, "0");
    reloj.textContent = `${m}:${s}`;
    reloj.classList.toggle("ultimo-minuto", segundos < 60);
  };
  const observador = new IntersectionObserver(([entrada]) => {
    if (entrada.isIntersecting && !intervalo) {
      intervalo = setInterval(() => {
        segundos = segundos > 0 ? segundos - 1 : 60 * 60;
        pintar();
      }, 1000);
    }
  });
  observador.observe(reloj);
}

function montarFoco() {
  const portada = document.getElementById("portada");
  portada.addEventListener("mousemove", e => {
    const caja = portada.getBoundingClientRect();
    portada.style.setProperty("--foco-x", `${e.clientX - caja.left}px`);
    portada.style.setProperty("--foco-y", `${e.clientY - caja.top}px`);
  });
}

function montarRevelado() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const elementos = [
    ...document.querySelectorAll("main > section:not(.portada) > .contenedor > :not(.recorrido)"),
    ...document.querySelectorAll(".parada"),
  ];
  document.querySelectorAll(".parada").forEach((p, i) => p.style.setProperty("--retraso", `${i * 120}ms`));
  const observador = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("revelado");
      observador.unobserve(e.target);
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  for (const el of elementos) {
    if (el.getBoundingClientRect().top < innerHeight) continue;
    el.classList.add("revelar");
    observador.observe(el);
  }
}

function montarMedidor(salas) {
  const palanca = document.getElementById("nivel-miedo");
  if (!palanca || !salas.length) return;
  const enlace = document.getElementById("medidor-sala");
  const foto = document.getElementById("medidor-foto");
  const info = document.getElementById("medidor-info");
  const nombres = ["Nada", "Un poco", "Lo justo", "Mucho", "Sin límite"];
  let actual = null;

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
    void enlace.offsetWidth;
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
