/* =====================================================================
   Ambientación de cada sala (ficha de sala.html).
   Un panel "desde dentro" que se mueve solo y cuenta algo de la sala:
   - San Tomás: un terminal de fósforo verde que escribe COBOL y falla.
   - Operación David: un despliegue que falla por localhost y reintenta.
   - La acampada de Sol: el acta de una asamblea que nunca llega a consenso.
   - El almacén de las mascarillas: el escáner de cajas y la UCO llegando.
   - El despertar del Perro: los apoyos de la moción de censura.
   - El camarote: el nivel del agua que sube.
   Con "menos movimiento" se ve el último estado, quieto.
   ===================================================================== */

const MENOS_MOVIMIENTO_AMBIENTE = matchMedia("(prefers-reduced-motion: reduce)").matches;

const AMBIENTES = {
  "el-manicomio-de-san-tomas": { titulo: "Terminal del pabellón C · 1974", clase: "ambiente-fosforo", montar: terminalCobol },
  "operacion-david": { titulo: "Consola de despliegue", clase: "ambiente-consola", montar: despliegueDavid },
  "la-acampada-de-sol": { titulo: "Acta de la asamblea (en directo)", clase: "ambiente-acta", montar: asambleaSol },
  "el-almacen-de-las-mascarillas": { titulo: "Inventario de la nave", clase: "ambiente-consola", montar: almacenMascarillas },
  "el-despertar-del-perro": { titulo: "Recuento de apoyos", clase: "ambiente-consola", montar: mocionPerro },
  "el-camarote-del-capitan-eduardo-el-panzas": { titulo: "Cuaderno de bitácora", clase: "ambiente-acta", montar: camarote }
};

function montarAmbiente(destino, sala) {
  const datos = AMBIENTES[sala.slug];
  if (!destino || !datos) return;
  const panel = document.createElement("aside");
  panel.className = `ambiente ${datos.clase}`;
  panel.setAttribute("aria-label", datos.titulo);
  panel.innerHTML = `<p class="ambiente-titulo"><span class="ambiente-piloto" aria-hidden="true"></span>${esc(datos.titulo)}</p><div class="ambiente-pantalla" aria-hidden="true"></div>`;
  destino.append(panel);
  datos.montar(panel.querySelector(".ambiente-pantalla"));
}

/* ---------- Utilidades ---------- */
const pausa = ms => new Promise(r => setTimeout(r, ms));
const azar = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const miles = n => n.toLocaleString("es-ES");

// Escribe líneas una a una, letra a letra, y repite el guion para siempre
async function escribirGuion(pantalla, guion) {
  if (MENOS_MOVIMIENTO_AMBIENTE) {
    pantalla.innerHTML = guion.map(l => `<div class="${l.clase || ""}">${esc(l.texto)}</div>`).join("");
    return;
  }
  for (;;) {
    pantalla.innerHTML = "";
    for (const linea of guion) {
      const div = document.createElement("div");
      if (linea.clase) div.className = linea.clase;
      pantalla.append(div);
      const cursor = document.createElement("span");
      cursor.className = "ambiente-cursor";
      if (linea.de_golpe) div.textContent = linea.texto;
      else for (const letra of linea.texto) { div.textContent += letra; div.append(cursor); await pausa(linea.lento ? 70 : 18); cursor.remove(); }
      div.append(cursor);
      await pausa(linea.espera ?? 220);
      cursor.remove();
      pantalla.scrollTop = pantalla.scrollHeight;
    }
    await pausa(4200);
  }
}

/* ---------- San Tomás ---------- */
function terminalCobol(pantalla) {
  escribirGuion(pantalla, [
    { texto: "       IDENTIFICATION DIVISION." },
    { texto: "       PROGRAM-ID. SALIR." },
    { texto: "       DATA DIVISION." },
    { texto: "       WORKING-STORAGE SECTION." },
    { texto: '       01 PUERTA   PIC X(7) VALUE "CERRADA".' },
    { texto: "       01 MINUTOS  PIC 9(3) VALUE 150." },
    { texto: "       PROCEDURE DIVISION." },
    { texto: '           PERFORM UNTIL PUERTA = "ABIERTA"' },
    { texto: '               DISPLAY "EL HERMANO TOMAS OS VE"' },
    { texto: "               SUBTRACT 1 FROM MINUTOS" },
    { texto: "           END-PERFORM", espera: 900 },
    { texto: "> COMPILANDO SALIR ...", lento: true, espera: 1200 },
    { texto: "> ERROR LINEA 0011: FALTA UN PUNTO.", clase: "alarma", espera: 700 },
    { texto: "> NADIE LO HA COMPILADO NUNCA.", clase: "alarma", lento: true }
  ]);
}

/* ---------- Operación David ---------- */
function despliegueDavid(pantalla) {
  const barra = pct => "[" + "#".repeat(Math.round(pct / 5)).padEnd(20, ".") + "] " + String(pct).padStart(3) + " %";
  if (MENOS_MOVIMIENTO_AMBIENTE) {
    escribirGuion(pantalla, [
      { texto: "$ npm run deploy" }, { texto: barra(100) },
      { texto: "✓ Desplegado en https://noexitrooms.example", clase: "bien" },
      { texto: "✗ Falta la documentación de Swagger.", clase: "alarma" },
      { texto: 'David: "Esto así no se entrega."', clase: "apagado" }
    ]);
    return;
  }
  (async () => {
    for (;;) {
      pantalla.innerHTML = "";
      const linea = (texto, clase = "") => { const d = document.createElement("div"); d.className = clase; d.textContent = texto; pantalla.append(d); pantalla.scrollTop = pantalla.scrollHeight; return d; };
      const progreso = async (hasta, falla) => {
        const d = linea(barra(0));
        for (let p = 0; p <= hasta; p += 5) { d.textContent = barra(p); await pausa(azar(40, 140)); }
        if (falla) d.classList.add("alarma");
      };
      linea("$ npm run deploy"); await pausa(500);
      await progreso(65, true);
      linea("✗ ERROR: la API apunta a http://localhost:3000", "alarma"); await pausa(900);
      linea('David: "En mi ordenador no funciona."', "apagado"); await pausa(1400);
      linea("$ sed -i 's/localhost/api.noexitrooms.example/' .env"); await pausa(900);
      linea("$ npm run deploy"); await pausa(400);
      await progreso(100, false);
      linea("✓ Desplegado en https://noexitrooms.example", "bien"); await pausa(1300);
      linea("✗ Falta la documentación de Swagger.", "alarma"); await pausa(800);
      linea('David: "Esto así no se entrega."', "apagado");
      await pausa(5000);
    }
  })();
}

/* ---------- La acampada de Sol ---------- */
function asambleaSol(pantalla) {
  const estado = { favor: 312, contra: 309, abst: 1204, turno: 147 };
  const propuestas = ["Disolver la acampada", "Irse a cenar", "Crear una comisión para decidir si se crea una comisión", "Votar si se vota", "Recoger las tiendas"];
  let propuesta = 0;
  function pintar() {
    pantalla.innerHTML = `
      <div class="acta-fila"><span>Propuesta</span><b>${esc(propuestas[propuesta])}</b></div>
      <div class="acta-fila"><span>Turno de palabra</span><b>nº ${miles(estado.turno)}</b></div>
      <div class="acta-votos">
        <span><b>${miles(estado.favor)}</b>A favor</span>
        <span><b>${miles(estado.contra)}</b>En contra</span>
        <span><b>${miles(estado.abst)}</b>Abstención</span>
      </div>
      <div class="acta-fila"><span>¿Consenso?</span><b class="alarma">No</b></div>`;
  }
  pintar();
  if (MENOS_MOVIMIENTO_AMBIENTE) return;
  let tic = 0;
  setInterval(() => {
    tic++;
    estado.favor += azar(-3, 4); estado.contra += azar(-3, 4); estado.abst += azar(0, 6);
    if (tic % 3 === 0) estado.turno++;
    if (tic % 9 === 0) propuesta = (propuesta + 1) % propuestas.length;
    pintar();
  }, 900);
}

/* ---------- El almacén de las mascarillas ---------- */
function almacenMascarillas(pantalla) {
  const contenidos = ["facturas", "más facturas", "un sobre", "mascarillas (caducadas)", "una agenda", "facturas sin cuadrar", "nada"];
  let caja = 127, segundos = 58 * 60 + 12;
  function pintar() {
    const m = String(Math.floor(segundos / 60)).padStart(2, "0"), s = String(segundos % 60).padStart(2, "0");
    pantalla.innerHTML = `
      <div>&gt; ESCANEANDO CAJA ${String(caja).padStart(4, "0")} / 1000</div>
      <div>&gt; CONTENIDO: ${esc(contenidos[caja % contenidos.length]).toUpperCase()}</div>
      <div>&gt; CAJA BUENA: <span class="alarma">NO ENCONTRADA</span></div>
      <div>&gt; FACTURAS CUADRADAS: ${caja % 11}/37</div>
      <div class="ambiente-grande">&gt; LA UCO LLEGA EN <span class="alarma">${m}:${s}</span></div>`;
  }
  pintar();
  if (MENOS_MOVIMIENTO_AMBIENTE) return;
  setInterval(() => { segundos = segundos > 0 ? segundos - 1 : 3600; if (segundos % 2 === 0) caja = caja >= 1000 ? 1 : caja + 1; pintar(); }, 1000);
}

/* ---------- El despertar del Perro ---------- */
function mocionPerro(pantalla) {
  const nombres = ["Ábalos", "Koldo", "Santos Cerdán"];
  let apoyos = 172, pagina = 1;
  function pintar() {
    pantalla.innerHTML = `
      <div class="ambiente-grande">APOYOS: <span class="${apoyos >= 176 ? "bien" : "alarma"}">${apoyos}</span> / 176</div>
      <div>&gt; MOCIÓN DE CENSURA: HOY A LAS 12:00</div>
      ${nombres.map(n => `<div>&gt; ${esc(n.toUpperCase())}: <span class="apagado">NO LOCALIZADO</span></div>`).join("")}
      <div>&gt; MANUAL DE RESISTENCIA: PÁGINA ${pagina} / 350</div>`;
  }
  pintar();
  if (MENOS_MOVIMIENTO_AMBIENTE) return;
  setInterval(() => {
    apoyos = Math.min(176, Math.max(168, apoyos + azar(-2, 2)));
    pagina = pagina >= 350 ? 1 : pagina + azar(1, 4);
    pintar();
  }, 1300);
}

/* ---------- El camarote del capitán Eduardo ---------- */
function camarote(pantalla) {
  let agua = 12;
  const notas = ["La despensa está vacía.", "Alguien se ha comido las galletas.", "El capitán niega haber visto las galletas.", "Hay migas en el abrigo del capitán."];
  function pintar() {
    pantalla.innerHTML = `
      <div class="acta-fila"><span>Nivel del agua</span><b class="alarma">${agua} cm ↑</b></div>
      <div class="acta-fila"><span>Bote salvavidas</span><b>Cerrado con llave</b></div>
      <div class="acta-fila"><span>Nota del día</span><b>${esc(notas[agua % notas.length])}</b></div>`;
  }
  pintar();
  if (MENOS_MOVIMIENTO_AMBIENTE) return;
  setInterval(() => { agua = agua >= 90 ? 12 : agua + 1; pintar(); }, 1500);
}
