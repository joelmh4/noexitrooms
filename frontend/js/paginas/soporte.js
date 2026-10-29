// Panel del agente: sus tickets y los que están sin asignar
iniciar(async yo => {
  const tickets = await api.tickets.listar();
  const mios = tickets.filter(t => t.agent_id === yo.id);
  const libres = tickets.filter(t => t.agent_id === null && t.status !== "cerrado");
  const form = document.getElementById("filtros");
  let pestana = "mios";

  document.getElementById("metricas").innerHTML = [
    ["Mis abiertos", mios.filter(t => !["resuelto", "cerrado"].includes(t.status)).length, "var(--estado-abierto)"],
    ["Esperando al cliente", mios.filter(t => t.status === "pendiente_cliente").length, "var(--estado-pendiente)"],
    ["Prioridad alta", mios.filter(t => t.priority === "alta" && t.status !== "cerrado").length, "var(--prioridad-alta)"],
    ["Sin asignar", libres.length, "var(--estado-cerrado)"]
  ].map(([texto, n, color]) => `<div class="metrica" style="--punto:${color}"><span>${texto}</span><b>${n}</b></div>`).join("");

  form.elements.estado.innerHTML = `<option value="">Todos los estados</option>` +
    Object.entries(ESTADOS).map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
  form.elements.prioridad.innerHTML = `<option value="">Todas las prioridades</option>` +
    Object.entries(PRIORIDADES).map(([v, t]) => `<option value="${v}">${t}</option>`).join("");

  function pintar() {
    document.querySelectorAll("[data-pestana]").forEach(b => b.setAttribute("aria-pressed", b.dataset.pestana === pestana));
    const estado = form.elements.estado.value;
    const prioridad = form.elements.prioridad.value;
    const base = pestana === "mios" ? mios : libres;
    const visibles = base.filter(t => (!estado || t.status === estado) && (!prioridad || t.priority === prioridad));
    document.getElementById("lista").innerHTML = tablaTickets(visibles, {
      enlace: "soporte-ticket.html",
      columnas: ["codigo", "asunto", "cliente", "estado", "prioridad", "fecha"]
    });
  }
  document.getElementById("pestanas").addEventListener("click", e => {
    const b = e.target.closest("[data-pestana]");
    if (b) { pestana = b.dataset.pestana; pintar(); }
  });
  document.querySelector('[data-pestana="mios"]').textContent = `Asignados a mí (${mios.length})`;
  document.querySelector('[data-pestana="libres"]').textContent = `Sin asignar (${libres.length})`;
  form.addEventListener("input", pintar);
  pintar();
});
