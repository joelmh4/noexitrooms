iniciar(async () => {
  const mios = await api.tickets.listar();
  const form = document.getElementById("filtros");

  document.getElementById("metricas").innerHTML = [
    ["Mis abiertos", mios.filter(t => !["resuelto", "cerrado"].includes(t.status)).length, "var(--estado-abierto)"],
    ["Esperando al cliente", mios.filter(t => t.status === "pendiente_cliente").length, "var(--estado-pendiente)"],
    ["Prioridad alta", mios.filter(t => t.priority === "alta" && t.status !== "cerrado").length, "var(--prioridad-alta)"],
    ["Resueltos", mios.filter(t => t.status === "resuelto").length, "var(--estado-resuelto)"]
  ].map(([texto, n, color]) => `<div class="metrica" style="--punto:${color}"><span>${texto}</span><b>${n}</b></div>`).join("");

  form.elements.estado.innerHTML = opciones(Object.entries(ESTADOS), "Todos los estados");
  form.elements.prioridad.innerHTML = opciones(Object.entries(PRIORIDADES), "Todas las prioridades");

  function pintar() {
    const estado = form.elements.estado.value;
    const prioridad = form.elements.prioridad.value;
    const visibles = mios.filter(t => (!estado || t.status === estado) && (!prioridad || t.priority === prioridad));
    document.getElementById("lista").innerHTML = tablaTickets(visibles, {
      enlace: "soporte-ticket.html",
      columnas: ["codigo", "asunto", "cliente", "estado", "prioridad", "fecha"]
    });
  }
  form.addEventListener("input", pintar);
  pintar();
});
