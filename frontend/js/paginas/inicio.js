// Inicio: foco de luz en la portada, salas destacadas y medidor de miedo
iniciar(async () => {
  montarReloj();   // no necesita la API, así que va lo primero
  const salas = await api.salas.listar();
  document.getElementById("destacadas").innerHTML = salas.slice(0, 3).map(tarjetaSala).join("");
  montarFoco();
  montarMedidor(salas);   // js/inicio-escenas.js
});

// Reloj de la franja oscura: una cuenta atrás de 60:00 que baja un segundo cada segundo.
// Empieza cuando la franja aparece en pantalla y, al llegar a 00:00, vuelve a empezar.
function montarReloj() {
  const reloj = document.getElementById("reloj-portada");
  if (!reloj) return;
  let segundos = 60 * 60;
  let intervalo = null;
  const pintar = () => {
    const m = String(Math.floor(segundos / 60)).padStart(2, "0");
    const s = String(segundos % 60).padStart(2, "0");
    reloj.textContent = `${m}:${s}`;
    reloj.classList.toggle("ultimo-minuto", segundos < 60);
  };
  const observador = new IntersectionObserver(([entrada]) => {
    if (entrada.isIntersecting && !intervalo) {
      intervalo = setInterval(() => {
        segundos = segundos > 0 ? segundos - 1 : 60 * 60;
        pintar();
      }, 1000);
    }
  });
  observador.observe(reloj);
}

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
