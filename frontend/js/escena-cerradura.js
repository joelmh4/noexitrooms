// Escena de la cerradura: al bajar, el ojo de la cerradura se abre y la frase aparece línea a línea
function montarCerradura() {
  const seccion = document.getElementById("cerradura");
  if (!seccion) return;
  const lineas = [...seccion.querySelectorAll(".linea")];
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { seccion.classList.add("estatica"); return; }

  let pendiente = false;
  function pintar() {
    pendiente = false;
    // Progreso 0 → 1 mientras la escena está fija en pantalla, 1:1 con el scroll
    const caja = seccion.getBoundingClientRect();
    const recorrido = caja.height - innerHeight;
    const p = Math.min(1, Math.max(0, -caja.top / recorrido));
    // La cerradura se abre en la primera mitad; con una curva suave para que empiece despacio
    const apertura = Math.min(1, p / .55);
    seccion.style.setProperty("--p", (apertura * apertura).toFixed(4));
    lineas.forEach((linea, i) => {
      const t = Math.min(1, Math.max(0, (p - (.1 + i * .17)) / .14));
      linea.style.opacity = t;
      linea.style.filter = `blur(${(1 - t) * 14}px)`;
      linea.style.transform = `translateY(${(1 - t) * .6}em)`;
    });
  }
  addEventListener("scroll", () => { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } }, { passive: true });
  addEventListener("resize", pintar);
  pintar();
}
