/* =====================================================================
   Transición de puerta entre páginas (solo web pública).
   Al pulsar un enlace interno, dos hojas de puerta metálica se cierran
   con un golpe seco; la página nueva empieza con la puerta cerrada y
   la abre. Con "menos movimiento" no se hace nada.
   ===================================================================== */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const CLAVE = "nxr-puerta";
  const capa = document.createElement("div");
  capa.className = "puertas";
  capa.setAttribute("aria-hidden", "true");
  capa.innerHTML = `<div class="hoja hoja-izquierda"></div><div class="hoja hoja-derecha"></div>`;

  // ¿Venimos de cerrar la puerta en la página anterior? (solo si fue hace nada)
  let llegando = false;
  try {
    llegando = Date.now() - Number(sessionStorage.getItem(CLAVE)) < 3000;
    sessionStorage.removeItem(CLAVE);
  } catch { /* sin sessionStorage: sin puerta */ }
  if (llegando) {
    capa.classList.add("cerradas");
    document.body.append(capa);
    setTimeout(() => capa.classList.add("abriendo"), 180);
    setTimeout(() => capa.remove(), 1100);
  }

  // Al volver atrás, el navegador puede enseñar la página con la puerta cerrada: la quitamos
  addEventListener("pageshow", e => { if (e.persisted) { capa.classList.remove("cerrando", "cerradas"); capa.remove(); } });

  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // anclas de la misma página
    e.preventDefault();
    capa.classList.remove("abriendo", "cerradas");
    document.body.append(capa);
    void capa.offsetWidth;
    capa.classList.add("cerrando");
    try { sessionStorage.setItem(CLAVE, String(Date.now())); } catch { /* nada */ }
    setTimeout(() => { location.href = a.href; }, 520);
  });
})();
