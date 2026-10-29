// Todos los tickets (admin) con filtros por cliente, agente, estado y prioridad
iniciar(async () => {
  const tickets = await api.tickets.listar();
  const form = document.getElementById("filtros");
  const unicos = (lista) => [...new Map(lista.map(p => [p.id, p])).values()].sort((a, b) => a.name.localeCompare(b.name, "es"));

  form.elements.cliente.innerHTML = `<option value="">Todos los clientes</option>` +
    unicos(tickets.map(t => t.cliente)).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  form.elements.agente.innerHTML = `<option value="">Todos los agentes</option><option value="ninguno">Sin asignar</option>` +
    unicos(tickets.filter(t => t.agente).map(t => t.agente)).map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("");
  form.elements.estado.innerHTML = `<option value="">Todos los estados</option>` +
    Object.entries(ESTADOS).map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
  form.elements.prioridad.innerHTML = `<option value="">Todas las prioridades</option>` +
    Object.entries(PRIORIDADES).map(([v, t]) => `<option value="${v}">${t}</option>`).join("");

  function pintar() {
    const f = Object.fromEntries(new FormData(form));
    const texto = f.buscar.trim().toLowerCase();
    const visibles = tickets.filter(t =>
      (!texto || t.subject.toLowerCase().includes(texto) || codigoTicket(t.id).toLowerCase().includes(texto)) &&
      (!f.cliente || t.customer_id === Number(f.cliente)) &&
      (!f.agente || (f.agente === "ninguno" ? t.agent_id === null : t.agent_id === Number(f.agente))) &&
      (!f.estado || t.status === f.estado) &&
      (!f.prioridad || t.priority === f.prioridad));
    document.getElementById("contador").textContent = `${visibles.length} de ${tickets.length} tickets`;
    document.getElementById("lista").innerHTML = tablaTickets(visibles, {
      enlace: "soporte-ticket.html",
      columnas: ["codigo", "asunto", "cliente", "agente", "estado", "prioridad", "fecha"]
    });
  }
  // Desde el dashboard se llega con un filtro puesto (?estado=abierto, ?agente=ninguno…)
  for (const campo of ["estado", "prioridad", "agente"]) {
    const valor = parametro(campo);
    if (valor && [...form.elements[campo].options].some(o => o.value === valor)) form.elements[campo].value = valor;
  }
  form.addEventListener("input", pintar);
  form.addEventListener("reset", () => setTimeout(pintar));
  form.addEventListener("submit", e => e.preventDefault());
  pintar();
});
