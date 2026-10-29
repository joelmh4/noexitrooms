/* =====================================================================
   Linterna.
   1) Portada: está a oscuras y el ratón (o el dedo) es una linterna.
      - Detrás van pasando las salas: la linterna parpadea (pilas
        gastadas) y, cuando vuelve la luz, estáis en otra sala.
      - Hay 4 números escondidos que solo se ven con la luz, como tinta
        UV. Son la combinación del candado (js/candado.js).
      - Al entrar por primera vez, la linterna se enciende con un clic.
      - En El manicomio de San Tomás, a veces hay unos ojos en la
        oscuridad que se esconden cuando les llega la luz.
      - Sin ratón, la luz busca sola por la habitación.
   2) Página 404: hay que buscar la puerta de salida con la linterna.
   3) Tarjetas de sala: la foto se ilumina donde pasa el ratón.
   Se dibuja en un <canvas>: una capa negra con un agujero de luz
   suave. Con "menos movimiento" no hay linterna y todo se ve normal.
   ===================================================================== */

const LINTERNA = {
  radio: 270,                 // radio del haz en px (escritorio)
  radioMovil: 150,
  oscuridad: 0.93,            // 1 = negro total fuera del haz
  cambioSala: [7000, 11000],  // cada cuánto parpadea y cambia de sala (ms, al azar entre los dos)
  motas: 70,                  // partículas de polvo
  codigo: "1974",             // el año en que encendieron el pabellón C de San Tomás
  ojos: "el-manicomio-de-san-tomas"
};
const MENOS_MOVIMIENTO_LINTERNA = matchMedia("(prefers-reduced-motion: reduce)").matches;
const limitarL = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ---------- Piezas de dibujo compartidas ---------- */
function dibujarOscuridad(ctx, ancho, alto, x, y, r, intensidad, oscuridad) {
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, ancho, alto);
  if (oscuridad <= 0) return;
  ctx.fillStyle = `rgba(6, 7, 8, ${oscuridad})`;
  ctx.fillRect(0, 0, ancho, alto);

  // Agujero de luz con borde suave
  ctx.globalCompositeOperation = "destination-out";
  const agujero = ctx.createRadialGradient(x, y, 0, x, y, r);
  agujero.addColorStop(0, `rgba(0,0,0,${intensidad})`);
  agujero.addColorStop(0.55, `rgba(0,0,0,${0.85 * intensidad})`);
  agujero.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = agujero;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  // Halo exterior muy tenue: la luz rebota en la habitación
  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.6);
  halo.addColorStop(0, `rgba(0,0,0,${0.18 * intensidad})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);

  // Luz cálida en el centro del haz
  ctx.globalCompositeOperation = "lighter";
  const calida = ctx.createRadialGradient(x, y, 0, x, y, r * 0.9);
  calida.addColorStop(0, `rgba(255, 236, 200, ${0.10 * intensidad})`);
  calida.addColorStop(1, "rgba(255, 236, 200, 0)");
  ctx.fillStyle = calida;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = "source-over";
}

function crearPolvo(n) {
  const nueva = alAzar => ({ x: Math.random(), y: alAzar ? Math.random() : 1.05, v: 0.00004 + Math.random() * 0.00012,
                             tam: 0.6 + Math.random() * 1.8, fase: Math.random() * Math.PI * 2 });
  const motas = Array.from({ length: n }, () => nueva(true));
  return (ctx, t, ancho, alto, x, y, r, intensidad) => {
    for (const m of motas) {
      m.y -= m.v * 16;
      m.x += Math.sin(t / 1600 + m.fase) * 0.00012;
      if (m.y < -0.05) Object.assign(m, nueva(false));
      const px = m.x * ancho, py = m.y * alto;
      const dist = Math.hypot(px - x, py - y) / r;
      if (dist > 1) continue;
      const a = (1 - dist) * 0.55 * intensidad * (0.6 + 0.4 * Math.sin(t / 500 + m.fase));
      ctx.fillStyle = `rgba(230, 255, 200, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, py, m.tam, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

// Anima solo mientras el elemento está en pantalla y la pestaña visible
function animarMientrasSeVea(elemento, paso) {
  let visible = true, frame = null;
  const bucle = t => { frame = null; if (!visible) return; paso(t); frame = requestAnimationFrame(bucle); };
  const arrancar = () => { if (!frame && visible) frame = requestAnimationFrame(bucle); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; arrancar(); }).observe(elemento);
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; arrancar(); });
  arrancar();
}

/* =====================================================================
   1) Portada
   Devuelve { alEncontrarPista(fn), encenderLuces() } para el candado.
   ===================================================================== */
function montarLinterna(salas) {
  const portada = document.querySelector(".portada");
  const api = { pistas: [], alEncontrarPista() {}, encenderLuces() {} };
  if (!portada || !salas.length) return api;

  // Las pistas: posición (fracción del hero) en escritorio y en móvil
  const pistas = LINTERNA.codigo.split("").map((digito, i) => ({
    digito, orden: ["I", "II", "III", "IV"][i], encontrada: false, tiempoLuz: 0,
    escritorio: [[0.6, 0.24], [0.92, 0.6], [0.72, 0.84], [0.56, 0.58]][i],
    movil: [[0.18, 0.1], [0.84, 0.16], [0.5, 0.26], [0.88, 0.38]][i],
    giro: [-0.12, 0.08, -0.05, 0.15][i]
  }));
  api.pistas = pistas;

  // Con menos movimiento no hay linterna: las pistas se ven fijas y tenues
  if (MENOS_MOVIMIENTO_LINTERNA) {
    portada.insertAdjacentHTML("beforeend", pistas.map(p =>
      `<span class="pista-fija" style="left:${p.escritorio[0] * 100}%;top:${p.escritorio[1] * 100}%" aria-hidden="true"><small>${p.orden}</small>${p.digito}</span>`).join(""));
    return api;
  }

  // ---------- Capas ----------
  const fondo = document.createElement("div");
  fondo.className = "linterna-fondo";
  fondo.setAttribute("aria-hidden", "true");
  fondo.innerHTML = salas.map((s, i) =>
    `<img src="${esc(fotoSala(s))}" alt="" decoding="async"${i === 0 ? ' class="activa"' : ""}>`).join("");
  const lienzo = document.createElement("canvas");
  lienzo.className = "linterna-oscuridad";
  lienzo.setAttribute("aria-hidden", "true");
  const rotulo = document.createElement("a");
  rotulo.className = "linterna-sala";
  const botonSonido = document.createElement("button");
  botonSonido.type = "button";
  botonSonido.className = "linterna-sonido";
  botonSonido.setAttribute("aria-pressed", "false");
  botonSonido.innerHTML = `${icono("volume-x")}<span>Sonido</span>`;
  portada.prepend(fondo, lienzo);
  portada.append(rotulo, botonSonido);
  portada.classList.add("linterna-activa");

  const fotos = [...fondo.children];
  const ctx = lienzo.getContext("2d");
  const tactil = matchMedia("(pointer: coarse)").matches;
  const polvo = crearPolvo(LINTERNA.motas);

  // ---------- Estado ----------
  let ancho = 0, alto = 0, sala = 0;
  const luz = { x: 0, y: 0, destinoX: 0, destinoY: 0, radio: 0, intensidad: 0 };
  let ultimoMovimiento = -Infinity;
  let parpadeo = null;
  let siguienteCambio = performance.now() + espera() + 2500;
  let lucesTotales = null;           // { inicio } mientras se encienden las luces de la sala
  let ojos = null;                   // { x, y, inicio, fuera } en San Tomás
  let siguientesOjos = performance.now() + 3000;

  // Encendido: solo la primera vez en esta visita
  let encendido = null;
  try { if (!sessionStorage.getItem("nxr-linterna")) encendido = { inicio: performance.now() + 350 }; sessionStorage.setItem("nxr-linterna", "1"); }
  catch { encendido = null; }
  if (encendido) portada.classList.add("linterna-apagada");

  function espera() {
    const [a, b] = LINTERNA.cambioSala;
    return a + Math.random() * (b - a);
  }

  function medir() {
    const caja = portada.getBoundingClientRect();
    ancho = Math.round(caja.width);
    alto = Math.round(caja.height);
    lienzo.width = ancho;     // resolución 1:1: la luz es suave y así va fluido en cualquier pantalla
    lienzo.height = alto;
    luz.radio = (ancho < 700 ? LINTERNA.radioMovil : LINTERNA.radio) * Math.max(0.8, Math.min(1.3, alto / 800));
    if (!luz.x) {             // la luz empieza sobre la sala, a la derecha del texto
      luz.x = luz.destinoX = ancho * (ancho < 700 ? 0.6 : 0.7);
      luz.y = luz.destinoY = alto * 0.42;
    }
  }

  function rotular() {
    const s = salas[sala];
    rotulo.href = `sala.html?slug=${encodeURIComponent(s.slug)}`;
    rotulo.innerHTML = `<span class="linterna-contador">SALA ${sala + 1}/${salas.length}</span> <b>${esc(s.name)}</b> <span aria-hidden="true">→</span>`;
    rotulo.setAttribute("aria-label", `Estás viendo ${s.name}. Ver la sala`);
  }

  function cambiarSala() {
    fotos[sala].classList.remove("activa");
    sala = (sala + 1) % salas.length;
    fotos[sala].classList.add("activa");
    ojos = null;
    siguientesOjos = performance.now() + 2500 + Math.random() * 2500;
    rotular();
  }

  // ---------- Movimiento de la luz ----------
  function apuntar(x, y) {
    luz.destinoX = x;
    luz.destinoY = y;
    ultimoMovimiento = performance.now();
  }
  function alMover(e) {
    const caja = portada.getBoundingClientRect();
    apuntar(e.clientX - caja.left, e.clientY - caja.top);
    moverPuntero(e, caja);
  }
  portada.addEventListener("pointermove", alMover);
  portada.addEventListener("pointerdown", alMover);

  // Puntito donde está el ratón: el cursor está oculto y la luz llega con retraso,
  // así se sabe siempre dónde apunta. Sobre enlaces y botones vuelve el cursor normal.
  const puntero = document.createElement("span");
  puntero.className = "linterna-puntero";
  puntero.setAttribute("aria-hidden", "true");
  portada.append(puntero);
  function moverPuntero(e, caja) {
    const visible = e.pointerType === "mouse" && !e.target.closest("a, button, input, label, .rueda-ventana");
    puntero.classList.toggle("visible", visible);
    if (visible) puntero.style.transform = `translate(${e.clientX - caja.left}px, ${e.clientY - caja.top}px)`;
  }
  portada.addEventListener("pointerleave", () => puntero.classList.remove("visible"));
  // Con teclado, la luz va a lo que tiene el foco
  portada.addEventListener("focusin", e => {
    const caja = portada.getBoundingClientRect(), el = e.target.getBoundingClientRect();
    apuntar(el.left + el.width / 2 - caja.left, el.top + el.height / 2 - caja.top);
  });

  function buscarSola(t) {
    const s = t / 1000;
    luz.destinoX = ancho * (0.62 + 0.24 * Math.sin(s * 0.33) + 0.06 * Math.sin(s * 1.1));
    luz.destinoY = alto * (0.45 + 0.22 * Math.sin(s * 0.47 + 1.3) + 0.05 * Math.cos(s * 0.9));
  }

  // ---------- Sonido ----------
  botonSonido.addEventListener("click", () => {
    const activo = sonido.alternar();
    botonSonido.setAttribute("aria-pressed", String(activo));
    botonSonido.innerHTML = `${icono(activo ? "volume-2" : "volume-x")}<span>Sonido</span>`;
    pintarIconos();
  });

  // ---------- Pistas UV ----------
  function posicionPista(p) {
    const [fx, fy] = ancho < 700 ? p.movil : p.escritorio;
    return [fx * ancho, fy * alto];
  }
  function dibujarPistas(t, r, dt) {
    const manual = t - ultimoMovimiento < 1500;   // solo cuenta si la buscas tú, no la luz automática
    for (const p of pistas) {
      const [x, y] = posicionPista(p);
      const dist = Math.hypot(x - luz.x, y - luz.y) / r;
      const a = limitarL((1 - dist) * 1.8) * luz.intensidad;
      if (a > 0.02 || p.encontrada) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.giro);
        ctx.shadowColor = "rgba(152, 252, 2, .9)";
        ctx.shadowBlur = 18;
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(152, 252, 2, ${Math.max(a, p.encontrada ? 0.08 : 0).toFixed(3)})`;
        ctx.font = `700 ${ancho < 700 ? 30 : 46}px "JetBrains Mono", monospace`;
        ctx.fillText(p.digito, 0, 14);
        ctx.font = `600 ${ancho < 700 ? 11 : 13}px "JetBrains Mono", monospace`;
        ctx.fillText(p.orden, 0, ancho < 700 ? -16 : -24);
        ctx.restore();
      }
      if (!p.encontrada && manual && a > 0.55) {
        p.tiempoLuz += dt;
        if (p.tiempoLuz > 500) {
          p.encontrada = true;
          sonido.tic();
          api.alEncontrarPista(p);
        }
      } else if (!p.encontrada) p.tiempoLuz = 0;
    }
  }

  // ---------- Ojos en San Tomás ----------
  function dibujarOjos(t, r) {
    if (salas[sala].slug !== LINTERNA.ojos || parpadeo) { ojos = null; return; }
    if (!ojos && t > siguientesOjos) {
      // Aparecen justo fuera del haz, en un sitio al azar alrededor
      const angulo = Math.random() * Math.PI * 2;
      const d = r * (1.25 + Math.random() * 0.35);
      const x = limitarL(luz.x + Math.cos(angulo) * d, 40, ancho - 40);
      const y = limitarL(luz.y + Math.sin(angulo) * d, 40, alto - 40);
      ojos = { x, y, inicio: t, fuera: null };
      sonido.susurro();
    }
    if (!ojos) return;
    const dist = Math.hypot(ojos.x - luz.x, ojos.y - luz.y) / r;
    if (!ojos.fuera && (dist < 1.05 || t - ojos.inicio > 4500)) ojos.fuera = t;   // la luz los asusta
    const entrada = limitarL((t - ojos.inicio) / 600);
    const salida = ojos.fuera ? 1 - limitarL((t - ojos.fuera) / 140) : 1;
    const cerrado = (t - ojos.inicio) % 2600 > 2450;                              // parpadean
    const a = entrada * salida * (cerrado ? 0 : 1);
    if (ojos.fuera && salida <= 0) { ojos = null; siguientesOjos = t + 4000 + Math.random() * 5000; return; }
    const sep = ancho < 700 ? 9 : 13;
    for (const lado of [-1, 1]) {
      const g = ctx.createRadialGradient(ojos.x + lado * sep, ojos.y, 0, ojos.x + lado * sep, ojos.y, 9);
      g.addColorStop(0, `rgba(235, 255, 190, ${0.95 * a})`);
      g.addColorStop(0.35, `rgba(190, 240, 80, ${0.55 * a})`);
      g.addColorStop(1, "rgba(152, 252, 2, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(ojos.x + lado * sep, ojos.y, 9, 5, lado * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- Encender las luces (cuando se abre el candado) ----------
  api.encenderLuces = () => { lucesTotales = { inicio: performance.now() }; };

  // ---------- Bucle ----------
  let anterior = performance.now();
  function paso(t) {
    const dt = Math.min(64, t - anterior);
    anterior = t;

    if (t - ultimoMovimiento > (tactil ? 2500 : 4000)) buscarSola(t);
    const suave = t - ultimoMovimiento < 4000 ? 0.16 : 0.035;
    luz.x += (luz.destinoX - luz.x) * suave;
    luz.y += (luz.destinoY - luz.y) * suave;

    if (encendido) {
      // Negro, clic, dos parpadeos y luz; después aparece el texto
      const d = t - encendido.inicio;
      const patron = [0, 0.7, 0, 0, 0.5, 0.1, 0.9, 0.3, 1];   // tramos de 90 ms
      const i = d < 0 ? -1 : Math.min(patron.length - 1, Math.floor(d / 90));
      luz.intensidad = i < 0 ? 0 : patron[i];
      if (i >= 1 && !encendido.clic) { sonido.clic(); encendido.clic = true; }
      if (i === patron.length - 1) {
        encendido = null;
        portada.classList.remove("linterna-apagada");
        siguienteCambio = t + espera();
      }
    } else {
      if (!parpadeo && t > siguienteCambio) { parpadeo = { inicio: t, cambia: false }; sonido.clic(); }
      if (parpadeo) {
        const d = t - parpadeo.inicio;
        const patron = [1, 0.15, 0.9, 0.05, 0.7, 0, 0, 0, 0.4, 0.1, 1];   // tramos de 70 ms
        const i = Math.min(patron.length - 1, Math.floor(d / 70));
        luz.intensidad = patron[i];
        if (!parpadeo.cambia && i >= 5) { cambiarSala(); parpadeo.cambia = true; }
        if (i === patron.length - 1) { parpadeo = null; siguienteCambio = t + espera(); }
      } else {
        luz.intensidad = 0.97 + 0.03 * Math.sin(t / 90) * Math.sin(t / 37);  // temblor leve de bombilla
      }
    }

    // Luces de la sala: suben, se quedan un momento y vuelven a apagarse
    let oscuridad = LINTERNA.oscuridad;
    if (lucesTotales) {
      const d = (t - lucesTotales.inicio) / 1000;
      const nivel = d < 0.6 ? d / 0.6 : d < 3.2 ? 1 : 1 - (d - 3.2) / 1.2;
      oscuridad *= 1 - limitarL(nivel) * 0.92;
      if (d > 4.4) lucesTotales = null;
    }

    const r = luz.radio * (0.85 + 0.15 * luz.intensidad);
    dibujarOscuridad(ctx, ancho, alto, luz.x, luz.y, r, luz.intensidad, oscuridad);
    polvo(ctx, t, ancho, alto, luz.x, luz.y, r, luz.intensidad);
    dibujarOjos(t, r);
    dibujarPistas(t, r, dt);
  }

  let anchoAnterior = innerWidth;
  addEventListener("resize", () => {
    if (tactil && innerWidth === anchoAnterior) return;   // en el móvil la barra del navegador cambia el alto: no rehacer
    anchoAnterior = innerWidth;
    medir();
  });

  medir();
  rotular();
  animarMientrasSeVea(portada, paso);
  return api;
}

/* =====================================================================
   2) Linterna sencilla (página 404): oscuridad, haz y polvo.
   Lo que hay debajo del lienzo solo se ve con la luz.
   ===================================================================== */
function montarLinternaSimple(zona) {
  if (!zona || MENOS_MOVIMIENTO_LINTERNA) return;
  const lienzo = document.createElement("canvas");
  lienzo.className = "linterna-oscuridad";
  lienzo.setAttribute("aria-hidden", "true");
  zona.prepend(lienzo);
  zona.classList.add("linterna-activa");
  const ctx = lienzo.getContext("2d");
  const polvo = crearPolvo(40);
  let ancho = 0, alto = 0, radio = 200, ultimo = -Infinity;
  const luz = { x: 0, y: 0, dx: 0, dy: 0 };

  function medir() {
    const caja = zona.getBoundingClientRect();
    ancho = lienzo.width = Math.round(caja.width);
    alto = lienzo.height = Math.round(caja.height);
    radio = ancho < 700 ? 130 : 190;
    if (!luz.x) { luz.x = luz.dx = ancho * 0.5; luz.y = luz.dy = alto * 0.3; }
  }
  const apuntar = (x, y) => { luz.dx = x; luz.dy = y; ultimo = performance.now(); };
  zona.addEventListener("pointermove", e => { const c = zona.getBoundingClientRect(); apuntar(e.clientX - c.left, e.clientY - c.top); });
  zona.addEventListener("pointerdown", e => { const c = zona.getBoundingClientRect(); apuntar(e.clientX - c.left, e.clientY - c.top); });
  zona.addEventListener("focusin", e => {
    const c = zona.getBoundingClientRect(), r = e.target.getBoundingClientRect();
    apuntar(r.left + r.width / 2 - c.left, r.top + r.height / 2 - c.top);
  });

  animarMientrasSeVea(zona, t => {
    if (t - ultimo > 3500) {   // busca sola, despacio, por toda la sala
      const s = t / 1000;
      luz.dx = ancho * (0.5 + 0.38 * Math.sin(s * 0.27));
      luz.dy = alto * (0.5 + 0.35 * Math.sin(s * 0.41 + 0.8));
    }
    const k = t - ultimo < 3500 ? 0.18 : 0.03;
    luz.x += (luz.dx - luz.x) * k;
    luz.y += (luz.dy - luz.y) * k;
    const intensidad = 0.97 + 0.03 * Math.sin(t / 90) * Math.sin(t / 37);
    dibujarOscuridad(ctx, ancho, alto, luz.x, luz.y, radio, intensidad, 0.96);
    polvo(ctx, t, ancho, alto, luz.x, luz.y, radio, intensidad);
  });
  addEventListener("resize", medir);
  medir();
}

/* =====================================================================
   3) Tarjetas de sala: la foto se ilumina donde pasa el ratón
   ===================================================================== */
if (!MENOS_MOVIMIENTO_LINTERNA && matchMedia("(pointer: fine)").matches) {
  document.addEventListener("pointermove", e => {
    const imagen = e.target.closest?.(".tarjeta-sala .imagen");
    if (!imagen) return;
    const caja = imagen.getBoundingClientRect();
    imagen.style.setProperty("--mx", `${e.clientX - caja.left}px`);
    imagen.style.setProperty("--my", `${e.clientY - caja.top}px`);
  }, { passive: true });
}
