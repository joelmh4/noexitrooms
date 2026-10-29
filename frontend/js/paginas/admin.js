// Dashboard del administrador: métricas y tickets sin asignar
iniciar(async () => {
  const [tickets, agentes] = await Promise.all([api.tickets.listar(), api.usuarios.agentes()]);
  const cuenta = (...estados) => tickets.filter(t => estados.includes(t.status)).length;

  document.getElementById("metricas").innerHTML = [
    ["Total", tickets.length, "var(--texto)"],
    ["Abiertos", cuenta("abierto"), "var(--estado-abierto)"],
    ["En curso", cuenta("en_curso", "pendiente_cliente"), "var(--estado-en-curso)"],
    ["Resueltos y cerrados", cuenta("resuelto", "cerrado"), "var(--estado-resuelto)"]
  ].map(([texto, n, color]) => `<div class="metrica" style="--punto:${color}"><span>${texto}</span><b>${n}</b></div>`).join("");

  // Carga de trabajo por agente
  document.getElementById("carga").innerHTML = agentes.map(a => {
    const activos = tickets.filter(t => t.agent_id === a.id && !["resuelto", "cerrado"].includes(t.status)).length;
    return `<div class="fila-entre"><span class="fila"><span class="avatar">${esc(iniciales(a.name))}</span>${esc(a.name)}</span><strong>${activos} activos</strong></div>`;
  }).join("");

  const libres = tickets.filter(t => t.agent_id === null && t.status !== "cerrado");
  const zona = document.getElementById("sin-asignar");
  if (!libres.length) {
    zona.innerHTML = `<div class="tabla-envoltorio"><p class="vacio">No hay tickets sin asignar. ¡Bien!</p></div>`;
    return;
  }
  zona.innerHTML = `
    <div class="tabla-envoltorio">
      <table>
        <thead><tr><th>Código</th><th>Asunto</th><th>Cliente</th><th>Prioridad</th><th>Creado</th><th>Asignar a</th></tr></thead>
        <tbody>
          ${libres.map(t => `
            <tr>
              <td class="codigo-ticket">${codigoTicket(t.id)}</td>
              <td><a href="soporte-ticket.html?id=${t.id}">${esc(t.subject)}</a><div class="subtexto">${esc(t.categoria)}</div></td>
              <td>${esc(t.cliente.name)}</td>
              <td>${chipPrioridad(t.priority)}</td>
              <td class="subtexto">${fechaHora(t.created_at)}</td>
              <td>
                <label class="solo-lectores" for="asignar-${t.id}">Asignar ${codigoTicket(t.id)}</label>
                <select id="asignar-${t.id}" data-ticket="${t.id}" class="boton boton-secundario boton-pequeno">
                  <option value="">Elegir agente</option>
                  ${agentes.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}
                </select>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
  zona.addEventListener("change", async e => {
    const select = e.target.closest("[data-ticket]");
    if (!select || !select.value) return;
    await api.tickets.asignar(Number(select.dataset.ticket), Number(select.value));
    toast("ok", `${codigoTicket(select.dataset.ticket)} asignado a ${select.selectedOptions[0].text}.`);
    setTimeout(() => location.reload(), 900);
  });
});
