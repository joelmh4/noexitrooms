// Inicio: linterna, candado y mosaico de salas en la portada, frase vista por la cerradura, salas destacadas y medidor de miedo
iniciar(async () => {
  const salas = await api.salas.listar();
  document.getElementById("destacadas").innerHTML = salas.slice(0, 3).map(tarjetaSala).join("");
  // La portada a oscuras, el ratón como linterna y el candado con las pistas (js/linterna.js, js/candado.js)
  montarCandado(montarLinterna(salas));
  // Todas las salas en la portada; al pulsar una se amplía con zoom (js/zoom-salas.js)
  montarMosaico(salas);
  // La frase se lee a través de una cerradura que se abre con el scroll (js/escena-cerradura.js)
  montarCerradura();
  // Medidor de miedo (js/inicio-escenas.js)
  montarMedidor(salas);
});
