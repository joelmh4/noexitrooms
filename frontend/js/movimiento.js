/* =====================================================================
   Movimiento fluido (pautas de diseño de Apple, WWDC "Designing Fluid
   Interfaces", llevadas a la web).
   - Muelles (springs) en vez de animaciones de duración fija: se pueden
     interrumpir y cambiar de destino en cualquier momento sin saltos.
   - Se parametrizan como Apple: "respuesta" (lo rápido que llega, en s)
     y "amortiguación" (1 = sin rebote, < 1 = rebota un poco).
   - Al soltar un gesto, el muelle sigue con la velocidad del dedo y se
     proyecta hacia dónde iba el gesto.
   Si el usuario pide menos movimiento, todo va directo a su destino.
   ===================================================================== */

const MENOS_MOVIMIENTO = matchMedia("(prefers-reduced-motion: reduce)");

// Muelles que usa Apple
const MUELLE = { respuesta: 0.4, amortiguacion: 1 };          // mover y recolocar
const MUELLE_CAJON = { respuesta: 0.3, amortiguacion: 0.8 };  // cajones y hojas (tras un gesto)

/* ---------- Un muelle de un solo valor ---------- */
// crearMuelle(valorInicial, alCambiar) → { ir(destino, {velocidad}), fijar(valor), valor, velocidad }
function crearMuelle(valorInicial, alCambiar, opciones = MUELLE) {
  let valor = valorInicial;
  let velocidad = 0;
  let destino = valorInicial;
  let frame = null;
  let alTerminar = null;
  let { respuesta, amortiguacion } = opciones;

  function paso(anterior) {
    return ahora => {
      // dt limitado para que un salto de pestaña no dispare el muelle
      const dt = Math.min((ahora - anterior) / 1000, 1 / 30);
      const rigidez = (2 * Math.PI / respuesta) ** 2;
      const friccion = 4 * Math.PI * amortiguacion / respuesta;
      velocidad += (-rigidez * (valor - destino) - friccion * velocidad) * dt;
      valor += velocidad * dt;
      if (Math.abs(valor - destino) < 0.05 && Math.abs(velocidad) < 0.5) {
        valor = destino;
        velocidad = 0;
        frame = null;
        alCambiar(valor);
        const fin = alTerminar; alTerminar = null; fin?.();
        return;
      }
      alCambiar(valor);
      frame = requestAnimationFrame(paso(ahora));
    };
  }

  return {
    get valor() { return valor; },
    get velocidad() { return velocidad; },
    // Cambia el destino desde el valor y la velocidad ACTUALES (interrumpible)
    ir(nuevoDestino, { velocidad: v, opciones: o, terminar } = {}) {
      destino = nuevoDestino;
      if (v !== undefined) velocidad = v;
      if (o) ({ respuesta, amortiguacion } = o);
      alTerminar = terminar || null;
      if (MENOS_MOVIMIENTO.matches) {
        cancelAnimationFrame(frame); frame = null;
        valor = destino; velocidad = 0; alCambiar(valor);
        const fin = alTerminar; alTerminar = null; fin?.();
        return;
      }
      if (!frame) frame = requestAnimationFrame(paso(performance.now()));
    },
    // Lo usa el arrastre: el elemento sigue al dedo 1:1
    fijar(nuevoValor) {
      cancelAnimationFrame(frame); frame = null; alTerminar = null;
      valor = destino = nuevoValor; velocidad = 0;
      alCambiar(valor);
    }
  };
}

/* ---------- Proyección del impulso (la fórmula de Apple) ---------- */
// Dónde acabaría algo lanzado a esa velocidad (px/s), como el scroll al soltar
function proyectar(velocidad, deceleracion = 0.998) {
  return (velocidad / 1000) * deceleracion / (1 - deceleracion);
}

/* ---------- Resistencia elástica en los bordes ---------- */
function goma(exceso, dimension, constante = 0.55) {
  return (exceso * dimension * constante) / (dimension + constante * Math.abs(exceso));
}

/* ---------- Arrastre con Pointer Events ---------- */
// Sigue al puntero 1:1 desde donde se agarró y, al soltar, entrega la
// velocidad media de los últimos movimientos.
function arrastrable(elemento, { eje = "y", umbral = 8, alEmpezar, alMover, alSoltar }) {
  let inicio = null;
  let historial = [];
  let activo = false;

  elemento.addEventListener("pointerdown", e => {
    if (e.button !== 0 || e.target.closest("a, button, input, select, textarea")) return;
    inicio = { x: e.clientX, y: e.clientY, id: e.pointerId };
    historial = [{ p: e[eje === "y" ? "clientY" : "clientX"], t: e.timeStamp }];
    activo = false;
  });
  elemento.addEventListener("pointermove", e => {
    if (!inicio || e.pointerId !== inicio.id) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    const d = eje === "y" ? dy : dx;
    if (!activo) {
      // Histéresis: no se decide la dirección hasta moverse unos píxeles
      if (Math.hypot(dx, dy) < umbral) return;
      if (Math.abs(eje === "y" ? dy : dx) < Math.abs(eje === "y" ? dx : dy)) { inicio = null; return; }
      activo = true;
      elemento.setPointerCapture(e.pointerId);
      alEmpezar?.();
    }
    historial.push({ p: e[eje === "y" ? "clientY" : "clientX"], t: e.timeStamp });
    if (historial.length > 5) historial.shift();
    alMover(d);
  });
  const soltar = e => {
    if (!inicio || e.pointerId !== inicio.id) return;
    const eraActivo = activo;
    inicio = null; activo = false;
    if (!eraActivo) return;
    const a = historial[0], b = historial[historial.length - 1];
    const velocidad = b.t > a.t ? (b.p - a.p) / ((b.t - a.t) / 1000) : 0;
    alSoltar(velocidad);
  };
  elemento.addEventListener("pointerup", soltar);
  elemento.addEventListener("pointercancel", soltar);
}

/* ---------- FLIP: recolocar elementos con muelles ---------- */
// Antes de cambiar la lista: const antes = fotografiar(contenedor)
// Después de pintarla: animarCambios(contenedor, antes)
function fotografiar(contenedor) {
  const mapa = new Map();
  contenedor.querySelectorAll("[data-clave]").forEach(el => mapa.set(el.dataset.clave, el.getBoundingClientRect()));
  return mapa;
}
function animarCambios(contenedor, antes) {
  if (MENOS_MOVIMIENTO.matches) return;
  contenedor.querySelectorAll("[data-clave]").forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    const previo = antes.get(el.dataset.clave);
    if (previo) {
      // Estaba antes: sale de su sitio anterior y llega al nuevo con un muelle por eje
      const dx = previo.left - rect.left;
      const dy = previo.top - rect.top;
      if (!dx && !dy) return;
      let x = dx, y = dy;
      const pintar = () => { el.style.transform = `translate(${x}px, ${y}px)`; };
      const mx = crearMuelle(dx, v => { x = v; pintar(); });
      const my = crearMuelle(dy, v => { y = v; pintar(); });
      pintar();
      mx.ir(0); my.ir(0, { terminar: () => { el.style.transform = ""; } });
    } else {
      // Nuevo: aparece en su sitio, creciendo un poco
      el.animate(
        [{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "none" }],
        { duration: 400, delay: Math.min(i, 6) * 30, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }
      );
    }
  });
}

/* ---------- El último sitio donde se pulsó (para anclar diálogos) ---------- */
let ultimoPunto = null;
document.addEventListener("pointerdown", e => { ultimoPunto = { x: e.clientX, y: e.clientY }; }, true);
function origenDesde(dialogo) {
  // El diálogo crece desde el botón que lo abrió
  if (!ultimoPunto) return;
  const r = dialogo.getBoundingClientRect();
  dialogo.style.transformOrigin = `${ultimoPunto.x - r.left}px ${ultimoPunto.y - r.top}px`;
}
// Todos los <dialog> de la web pasan por aquí: crecen desde el botón y se van por el mismo camino
const abrirDialogoNativo = HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal = function () {
  abrirDialogoNativo.call(this);
  origenDesde(this);
};
const cerrarDialogoNativo = HTMLDialogElement.prototype.close;
HTMLDialogElement.prototype.close = function (valor) {
  if (MENOS_MOVIMIENTO.matches || this.classList.contains("cerrando") || !this.open) {
    return cerrarDialogoNativo.call(this, valor);
  }
  this.classList.add("cerrando");
  setTimeout(() => { this.classList.remove("cerrando"); cerrarDialogoNativo.call(this, valor); }, 200);
};
// Los formularios method="dialog" cierran sin llamar a close(): los interceptamos
document.addEventListener("submit", e => {
  const form = e.target;
  if (form.method !== "dialog" || MENOS_MOVIMIENTO.matches) return;
  const dialogo = form.closest("dialog");
  if (!dialogo) return;
  e.preventDefault();
  dialogo.close(e.submitter?.value ?? "");
}, true);
// Escape también se va por el mismo camino
document.addEventListener("cancel", e => {
  if (e.target instanceof HTMLDialogElement && !MENOS_MOVIMIENTO.matches) {
    e.preventDefault();
    e.target.close("");
  }
}, true);

/* ---------- Transición entre páginas ---------- */
// La hace el navegador (CSS @view-transition). Si se navega otra vez antes de
// que termine, el navegador la cancela: lo ignoramos para no ensuciar la consola.
const calmar = vt => { if (!vt) return; vt.ready?.catch(() => {}); vt.finished?.catch(() => {}); vt.updateCallbackDone?.catch(() => {}); };
addEventListener("pageswap", e => calmar(e.viewTransition));
addEventListener("pagereveal", e => calmar(e.viewTransition));
