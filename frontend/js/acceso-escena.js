// Escena de login y registro: la foto de la llave reacciona al ratón, la cerradura se carga de luz
// según rellenas el formulario y, al entrar, la cámara se mete por la cerradura y la luz inunda la pantalla
const OJO_CERRADURA = { x: 0.367, y: 0.695 };   // posición de la cerradura dentro de img/acceso.webp
const POSICION_FOTO = { x: 0.5, y: 0.7 };        // igual que object-position en css/acceso.css

function montarEscenaAcceso() {
  const marca = document.querySelector(".acceso-marca.con-foto");
  const foto = marca?.querySelector(".acceso-fondo");
  const form = document.querySelector(".acceso-formulario form");
  if (!marca || !foto || !form) return null;
  const quieto = () => MENOS_MOVIMIENTO.matches;

  // Capa que se mueve con el ratón: la foto y el brillo de la cerradura van juntos
  const capa = document.createElement("div");
  capa.className = "acceso-capa";
  const brillo = document.createElement("span");
  brillo.className = "acceso-brillo";
  foto.before(capa);
  capa.append(foto, brillo);

  // Dónde cae la cerradura con object-fit: cover
  function colocarBrillo() {
    const W = marca.clientWidth, H = marca.clientHeight;
    const s = Math.max(W / foto.naturalWidth, H / foto.naturalHeight);
    const w = foto.naturalWidth * s, h = foto.naturalHeight * s;
    const x = (W - w) * POSICION_FOTO.x + OJO_CERRADURA.x * w;
    const y = (H - h) * POSICION_FOTO.y + OJO_CERRADURA.y * h;
    capa.style.setProperty("--ojo-x", `${x}px`);
    capa.style.setProperty("--ojo-y", `${y}px`);
  }
  foto.complete ? colocarBrillo() : foto.addEventListener("load", colocarBrillo);
  // El panel cambia de alto al cargar las fuentes o girar el móvil
  new ResizeObserver(colocarBrillo).observe(marca);

  // Paralaje: la foto sigue al ratón con un muelle (se puede interrumpir en cualquier momento)
  const mx = crearMuelle(0, v => capa.style.setProperty("--px", `${v.toFixed(1)}px`));
  const my = crearMuelle(0, v => capa.style.setProperty("--py", `${v.toFixed(1)}px`));
  addEventListener("pointermove", e => {
    if (quieto() || e.pointerType !== "mouse") return;
    mx.ir((0.5 - e.clientX / innerWidth) * 28);
    my.ir((0.5 - e.clientY / innerHeight) * 20);
  });

  // Pernos de la cerradura junto a la contraseña: suben uno a uno al escribir
  const clave = form.elements.password;
  const pernos = document.createElement("div");
  pernos.className = "pernos";
  pernos.setAttribute("aria-hidden", "true");
  pernos.innerHTML = "<span></span>".repeat(5);
  clave.closest(".campo").append(pernos);

  // Carga de luz: email válido + longitud de la contraseña
  function cargar() {
    const email = form.elements.email;
    const correo = email && EMAIL_VALIDO.test(email.value.trim()) ? 0.4 : 0;
    const largo = Math.min(clave.value.length / 8, 1);
    marca.style.setProperty("--carga", (correo + largo * 0.6).toFixed(3));
    const subidos = Math.min(5, Math.ceil(clave.value.length * 5 / 8));
    [...pernos.children].forEach((p, i) => p.classList.toggle("arriba", i < subidos));
  }
  form.addEventListener("input", cargar);
  cargar();

  const esperar = ms => new Promise(r => setTimeout(r, ms));

  return {
    cargar,
    // Acceso correcto: los pernos se ponen verdes, la cámara entra por la cerradura y la luz lo llena todo
    async abrir(texto = "ACCESO CONCEDIDO") {
      cargar();
      pernos.classList.add("abiertos");
      marca.style.setProperty("--carga", 1);
      const ojo = brillo.getBoundingClientRect();
      const luz = document.createElement("div");
      luz.className = "acceso-luz";
      luz.style.setProperty("--x", `${ojo.left + ojo.width / 2}px`);
      luz.style.setProperty("--y", `${ojo.top + ojo.height / 2}px`);
      luz.innerHTML = `<span>${esc(texto)}</span>`;
      document.body.append(luz);
      if (quieto()) { luz.classList.add("encendida"); await esperar(500); return; }
      await esperar(260);
      marca.classList.add("entrando");
      requestAnimationFrame(() => luz.classList.add("encendida"));
      await esperar(1500);
    },
    // Fallo: la puerta da un golpe, la cerradura parpadea en rojo y los pernos caen
    fallar() {
      [...pernos.children].forEach(p => p.classList.remove("arriba"));
      for (const el of [marca, form]) { el.classList.remove("fallo"); void el.offsetWidth; el.classList.add("fallo"); }
      setTimeout(() => { marca.classList.remove("fallo"); form.classList.remove("fallo"); cargar(); }, 700);
    }
  };
}

