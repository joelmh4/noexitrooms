/* =====================================================================
   Candado de la portada: 4 ruedas de números.
   Los 4 dígitos están escondidos en la oscuridad (js/linterna.js) y solo
   se ven con la luz. Quien abre el candado se lleva un código de
   descuento que se canjea abriendo un ticket.
   Es accesible con teclado: cada rueda es un spinbutton (flechas arriba
   y abajo) y también tiene botones ▲ ▼.
   ===================================================================== */

const CANDADO = {
  codigo: "1974",
  premio: "NOEXIT-1974"
};

function montarCandado(linterna) {
  const destino = document.querySelector(".portada-texto");
  if (!destino) return;

  const caja = document.createElement("div");
  caja.className = "candado";
  caja.innerHTML = `
    <svg class="candado-dibujo" viewBox="0 0 48 60" aria-hidden="true">
      <path class="candado-arco" d="M12 28V18a12 12 0 0 1 24 0v10" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <rect x="4" y="26" width="40" height="32" rx="7" fill="currentColor"/>
      <circle cx="24" cy="40" r="4" fill="#111315"/><rect x="22" y="42" width="4" height="8" rx="2" fill="#111315"/>
    </svg>
    <div class="candado-cuerpo">
      <p class="candado-pista" id="candado-pista">Hay 4 números escondidos en la oscuridad. Buscadlos con la linterna: <b>0 de 4</b></p>
      <div class="candado-ruedas" role="group" aria-labelledby="candado-pista">
        ${[0, 1, 2, 3].map(i => `
          <div class="rueda" data-rueda="${i}">
            <button type="button" class="rueda-boton" data-paso="1" aria-label="Subir la rueda ${i + 1}" tabindex="-1">▲</button>
            <div class="rueda-ventana" role="spinbutton" tabindex="0" aria-label="Rueda ${i + 1}" aria-valuemin="0" aria-valuemax="9" aria-valuenow="0">
              <div class="rueda-cinta">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<span>${n}</span>`).join("")}</div>
            </div>
            <button type="button" class="rueda-boton" data-paso="-1" aria-label="Bajar la rueda ${i + 1}" tabindex="-1">▼</button>
          </div>`).join("")}
      </div>
    </div>
    <div class="candado-premio" hidden role="status">
      <span class="etiqueta-superior">Candado abierto</span>
      <p>Código <b>${CANDADO.premio}</b>: 10&nbsp;% de descuento en vuestra primera sala.</p>
      <a class="boton boton-primario" href="nuevo-ticket.html?bono=${CANDADO.premio}">Canjear con un ticket</a>
    </div>`;
  destino.append(caja);

  const valores = [0, 0, 0, 0];
  const ventanas = [...caja.querySelectorAll(".rueda-ventana")];
  const pista = caja.querySelector(".candado-pista b");
  const premio = caja.querySelector(".candado-premio");
  let abierto = false;

  function pintar(i) {
    const v = ventanas[i];
    v.setAttribute("aria-valuenow", valores[i]);
    v.querySelector(".rueda-cinta").style.transform = `translateY(${-valores[i] * 10}%)`;
  }

  function girar(i, paso) {
    if (abierto) return;
    valores[i] = (valores[i] + paso + 10) % 10;
    pintar(i);
    sonido.tic();
    comprobar();
  }

  function comprobar() {
    if (valores.join("") !== CANDADO.codigo) return;
    abierto = true;
    caja.classList.add("abierto");
    sonido.abrir();
    linterna.encenderLuces();
    setTimeout(() => {
      premio.hidden = false;
      caja.querySelector(".candado-cuerpo").hidden = true;
      premio.querySelector("a").focus({ preventScroll: true });
    }, 650);
  }

  caja.addEventListener("click", e => {
    const b = e.target.closest(".rueda-boton");
    if (b) girar(Number(b.closest(".rueda").dataset.rueda), Number(b.dataset.paso));
  });
  ventanas.forEach((v, i) => {
    v.addEventListener("keydown", e => {
      const pasos = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); girar(i, Number(e.key) - valores[i]); return; }
      if (!(e.key in pasos)) return;
      e.preventDefault();
      girar(i, pasos[e.key]);
    });
    // La rueda del ratón también gira la rueda del candado
    v.addEventListener("wheel", e => { e.preventDefault(); girar(i, e.deltaY < 0 ? 1 : -1); }, { passive: false });
  });

  // Contador de pistas encontradas
  let encontradas = linterna.pistas.filter(p => p.encontrada).length;
  const contar = () => { pista.textContent = `${encontradas} de 4`; };
  linterna.alEncontrarPista = () => { encontradas++; contar(); caja.classList.add("pista-nueva"); setTimeout(() => caja.classList.remove("pista-nueva"), 600); };
  // Sin linterna (menos movimiento) las pistas ya están a la vista
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    caja.querySelector(".candado-pista").innerHTML = "Los 4 números están escritos en la portada, con su orden (I, II, III, IV).";
  }
  contar();
}
