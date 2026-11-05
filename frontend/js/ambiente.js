/* =====================================================================
   Ambientación de cada sala (ficha de sala.html).
   Un panel con un texto "desde dentro" de la sala: un terminal, una consola,
   un acta… Es solo contenido: para cada sala guardamos un título, una clase
   CSS (el aspecto del panel) y las líneas que se muestran.
   Las líneas con clase "alarma", "bien" o "apagado" cambian de color.
   (La pantalla usa white-space: pre-wrap para respetar la sangría del COBOL,
   por eso las líneas se pegan sin saltos de línea en medio.)
   ===================================================================== */

const AMBIENTES = {
  "el-manicomio-de-san-tomas": {
    titulo: "Terminal del pabellón C · 1974",
    clase: "ambiente-fosforo",
    lineas: [
      ["       IDENTIFICATION DIVISION."],
      ["       PROGRAM-ID. SALIR."],
      ['       01 PUERTA   PIC X(7) VALUE "CERRADA".'],
      ["       01 MINUTOS  PIC 9(3) VALUE 150."],
      ["       PROCEDURE DIVISION."],
      ['           PERFORM UNTIL PUERTA = "ABIERTA"'],
      ['               DISPLAY "EL HERMANO TOMAS OS VE"'],
      ["           END-PERFORM"],
      ["> COMPILANDO SALIR ..."],
      ["> ERROR LINEA 0011: FALTA UN PUNTO.", "alarma"],
      ["> NADIE LO HA COMPILADO NUNCA.", "alarma"]
    ]
  },
  "operacion-david": {
    titulo: "Consola de despliegue",
    clase: "ambiente-consola",
    lineas: [
      ["$ npm run deploy"],
      ["✗ ERROR: la API apunta a http://localhost:3000", "alarma"],
      ['David: "En mi ordenador no funciona."', "apagado"],
      ["$ npm run deploy"],
      ["✓ Desplegado en https://noexitrooms.example", "bien"],
      ["✗ Falta la documentación de Swagger.", "alarma"],
      ['David: "Esto así no se entrega."', "apagado"]
    ]
  },
  "la-acampada-de-sol": {
    titulo: "Acta de la asamblea",
    clase: "ambiente-consola",
    lineas: [
      ["> PROPUESTA: crear una comisión para decidir si se crea una comisión"],
      ["> TURNO DE PALABRA: nº 147"],
      ["> A FAVOR 312 · EN CONTRA 309 · ABSTENCIÓN 1.204"],
      ["> ¿CONSENSO? NO", "alarma"]
    ]
  },
  "el-almacen-de-las-mascarillas": {
    titulo: "Inventario de la nave",
    clase: "ambiente-consola",
    lineas: [
      ["> ESCANEANDO CAJA 0127 / 1000"],
      ["> CONTENIDO: FACTURAS SIN CUADRAR"],
      ["> CAJA BUENA: NO ENCONTRADA", "alarma"],
      ["> LA UCO LLEGA EN 58:12", "alarma"]
    ]
  },
  "el-despertar-del-perro": {
    titulo: "Recuento de apoyos",
    clase: "ambiente-consola",
    lineas: [
      ["> APOYOS: 172 / 176", "alarma"],
      ["> MOCIÓN DE CENSURA: HOY A LAS 12:00"],
      ["> ÁBALOS: NO LOCALIZADO", "apagado"],
      ["> KOLDO: NO LOCALIZADO", "apagado"],
      ["> SANTOS CERDÁN: NO LOCALIZADO", "apagado"],
      ["> MANUAL DE RESISTENCIA: PÁGINA 1 / 350"]
    ]
  },
  "el-camarote-del-capitan-eduardo-el-panzas": {
    titulo: "Cuaderno de bitácora",
    clase: "ambiente-consola",
    lineas: [
      ["> NIVEL DEL AGUA: 12 cm Y SUBIENDO", "alarma"],
      ["> BOTE SALVAVIDAS: CERRADO CON LLAVE"],
      ["> NOTA DEL DÍA: alguien se ha comido las galletas."],
      ["> El capitán niega haber visto las galletas.", "apagado"]
    ]
  }
};

function montarAmbiente(destino, sala) {
  const datos = AMBIENTES[sala.slug];
  if (!destino || !datos) return;
  destino.innerHTML = `
    <aside class="ambiente ${datos.clase}" aria-label="${esc(datos.titulo)}">
      <p class="ambiente-titulo"><span class="ambiente-piloto" aria-hidden="true"></span>${esc(datos.titulo)}</p>
      <div class="ambiente-pantalla">${datos.lineas.map(([texto, clase]) => `<div class="${clase || ""}">${esc(texto)}</div>`).join("")}</div>
    </aside>`;
}
