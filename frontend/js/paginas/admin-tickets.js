iniciar(async () => {
  const tickets = await api.tickets.listar();
  const form = document.getElementById("filtros");
  const f = form.elements;
  const personas = lista => [...new Map(lista.map(p => [p.id, p])).values()]
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map(p => [p.id, p.name]);

  f.cliente.innerHTML = opciones(personas(tickets.map(t => t.cliente)), "Todos los clientes");
  f.agente.innerHTML = opciones([["ninguno", "Sin asignar"], ...personas(tickets.filter(t => t.agente).map(t => t.agente))], "Todos los agentes");
  f.estado.innerHTML = opciones(Object.entries(ESTADOS), "Todos los estados");
  f.prioridad.innerHTML = opciones(Object.entries(PRIORIDADES), "Todas las prioridades");

  for (const campo of ["estado", "prioridad", "agente"]) {
    const valor = parametro(campo);
    if (valor && [...f[campo].options].some(o => o.value === valor)) f[campo].value = valor;
  }

  function pintar() {
    const filtro = Object.fromEntries(new FormData(form));
    const texto = filtro.buscar.trim().toLowerCase();
    const visibles = tickets.filter(t =>
      (!texto || t.subject.toLowerCase().includes(texto) || codigoTicket(t.id).toLowerCase().includes(texto)) &&
      (!filtro.cliente || t.customer_id === Number(filtro.cliente)) &&
      (!filtro.agente || (filtro.agente === "ninguno" ? t.agent_id === null : t.agent_id === Number(filtro.agente))) &&
      (!filtro.estado || t.status === filtro.estado) &&
      (!filtro.prioridad || t.priority === filtro.prioridad));
    document.getElementById("contador").textContent = `${visibles.length} de ${tickets.length} tickets`;
    document.getElementById("lista").innerHTML = tablaTickets(visibles, {
      enlace: "soporte-ticket.html",
      columnas: ["codigo", "asunto", "cliente", "agente", "estado", "prioridad", "fecha"]
    });
  }
  form.addEventListener("input", pintar);
  form.addEventListener("reset", () => setTimeout(pintar));
  form.addEventListener("submit", e => e.preventDefault());
  pintar();
});
