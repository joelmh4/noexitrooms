// Inicio: foco de luz en la portada, salas destacadas y medidor de miedo
iniciar(async () => {
  const salas = await api.salas.listar();
  document.getElementById("destacadas").innerHTML = salas.slice(0, 3).map(tarjetaSala).join("");
  montarFoco();
  montarMedidor(salas);   // js/inicio-escenas.js
});

// La portada está a oscuras y el ratón ilumina un círculo. El círculo es un degradado de CSS
// (.portada::after en css/inicio.css): aquí solo le decimos dónde está el ratón con dos variables.
function montarFoco() {
  const portada = document.getElementById("portada");
  portada.addEventListener("mousemove", e => {
    const caja = portada.getBoundingClientRect();
    portada.style.setProperty("--foco-x", `${e.clientX - caja.left}px`);
    portada.style.setProperty("--foco-y", `${e.clientY - caja.top}px`);
  });
}
