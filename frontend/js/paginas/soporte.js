// Panel del agente: los tickets que tiene asignados (la API no le devuelve otros)
iniciar(async yo => {
  const mios = await api.tickets.listar();
  const form = document.getElementById("filtros");

  document.getElementById("metricas").innerHTML = [
    ["Mis abiertos", mios.filter(t => !["resuelto", "cerrado"].includes(t.status)).length, "var(--estado-abierto)"],
    ["Esperando al cliente", mios.filter(t => t.status === "pendiente_cliente").length, "var(--estado-pendiente)"],
    ["Prioridad alta", mios.filter(t => t.priority === "alta" && t.status !== "cerrado").length, "var(--prioridad-alta)"],
    ["Resueltos", mios.filter(t => t.status === "resuelto").length, "var(--estado-resuelto)"]
  ].map(([texto, n, color]) => `<div class="metrica" style="--punto:${color}"><span>${texto}</span><b>${n}</b></div>`).join("");

  form.elements.estado.innerHTML = `<option value="">Todos los estados</option>` +
    Object.entries(ESTADOS).map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
  form.elements.prioridad.innerHTML = `<option value="">Todas las prioridades</option>` +
    Object.entries(PRIORIDADES).map(([v, t]) => `<option value="${v}">${t}</option>`).join("");

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
