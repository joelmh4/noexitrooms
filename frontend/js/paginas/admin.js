iniciar(async () => {
  const [stats, tickets, agentes] = await Promise.all([api.estadisticas(), api.tickets.listar(), api.usuarios.agentes()]);
  const t = stats.tickets;
  const urgencia = ["alta", "media", "baja"];
  document.getElementById("fecha-hoy").textContent =
    new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });

  const horas = t.horas_medias_hasta_resolver;
  document.getElementById("monitores").innerHTML = [
    { titulo: "Activos", valor: t.activos, detalle: `de ${t.total} en total`, color: "var(--estado-abierto)", href: "admin-tickets.html" },
    { titulo: "Sin asignar", valor: t.sin_asignar.total, detalle: t.sin_asignar.alta ? `${t.sin_asignar.alta} de prioridad alta` : "ninguno urgente",
      color: t.sin_asignar.alta ? "var(--prioridad-alta)" : "var(--estado-cerrado)", alerta: t.sin_asignar.alta > 0, href: "#t-libres" },
    { titulo: "Tiempo hasta resolver", valor: horas === null ? "—" : horas < 48 ? `${String(horas).replace(".", ",")} h` : `${Math.round(horas / 24)} d`,
      detalle: "media hasta el primer «resuelto»", color: "var(--estado-resuelto)" },
    { titulo: "Reservas por confirmar", valor: stats.reservas.pendientes_de_confirmar, detalle: `${stats.reservas.proximos_7_dias} ${stats.reservas.proximos_7_dias === 1 ? "partida" : "partidas"} en 7 días`,
      color: "var(--estado-en-curso)", href: "admin-reservas.html" }
  ].map(m => {
    const dentro = `<span class="monitor-titulo"><span class="piloto" style="--c:${m.color}"></span>${m.titulo}</span><b>${m.valor}</b><small>${m.detalle}</small>`;
    return m.href
      ? `<a class="monitor${m.alerta ? " monitor-alerta" : ""}" href="${m.href}">${dentro}</a>`
      : `<div class="monitor">${dentro}</div>`;
  }).join("");

  const estados = Object.entries(t.por_estado);
  document.getElementById("cola").innerHTML = t.total ? `
    <div class="barra-apilada" role="img" aria-label="${estados.map(([e, n]) => `${ESTADOS[e]}: ${n}`).join(", ")}">
      ${estados.filter(([, n]) => n).map(([e, n]) => `<span style="flex:${n};--c:var(--estado-${e === "en_curso" ? "en-curso" : e === "pendiente_cliente" ? "pendiente" : e})" title="${ESTADOS[e]}: ${n}"></span>`).join("")}
    </div>
    <ul class="leyenda">
      ${estados.map(([e, n]) => `<li><a href="admin-tickets.html?estado=${e}">${chipEstado(e)}<b>${n}</b></a></li>`).join("")}
    </ul>` : `<p class="vacio">Todavía no hay tickets.</p>`;

  const maxPrioridad = Math.max(1, ...Object.values(t.activos_por_prioridad));
  document.getElementById("prioridades").innerHTML = `<div class="barras-lista">${urgencia.map(p => `
    <div class="barra-fila">
      ${chipPrioridad(p)}
      <span class="barra-pista"><span style="width:${t.activos_por_prioridad[p] / maxPrioridad * 100}%;--c:var(--prioridad-${p})"></span></span>
      <b>${t.activos_por_prioridad[p]}</b>
    </div>`).join("")}</div>`;

  const maxCarga = Math.max(1, ...stats.agentes.map(a => a.activos));
  document.getElementById("carga").innerHTML = stats.agentes.length ? stats.agentes.map(a => `
    <div class="agente-carga">
      <div class="fila-entre"><span class="fila" style="gap:10px"><span class="avatar">${esc(iniciales(a.name))}</span><b>${esc(a.name)}</b></span><span class="subtexto">${a.resueltos} ${a.resueltos === 1 ? "resuelto" : "resueltos"}</span></div>
      <span class="barra-pista" role="img" aria-label="${a.activos} activos, ${a.pendientes_cliente} esperando al cliente">
        <span style="width:${(a.activos - a.pendientes_cliente) / maxCarga * 100}%;--c:var(--estado-en-curso)"></span><span style="width:${a.pendientes_cliente / maxCarga * 100}%;--c:var(--estado-pendiente)"></span>
      </span>
      <span class="subtexto">${a.activos} ${a.activos === 1 ? "activo" : "activos"}${a.pendientes_cliente ? ` · ${a.pendientes_cliente} esperando al cliente` : ""}</span>
    </div>`).join("") : `<p class="vacio">No hay agentes activos.</p>`;

  const maxCategoria = Math.max(1, ...t.por_categoria.map(c => c.n));
  document.getElementById("categorias").innerHTML = `<div class="barras-lista">${t.por_categoria.map(c => `
    <div class="barra-fila barra-fila-texto">
      <span>${esc(c.name)}</span>
      <span class="barra-pista"><span style="width:${c.n / maxCategoria * 100}%;--c:var(--color-neon)"></span></span>
      <b>${c.n}</b>
    </div>`).join("")}</div>`;

  const porDia = Object.fromEntries(t.creados_ultimos_7_dias.map(d => [d.dia, d.n]));
  const dias = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return { n: porDia[fechaIso(d)] || 0, letra: d.toLocaleDateString("es-ES", { weekday: "narrow" }), nombre: d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" }) };
  });
  const maxDia = Math.max(1, ...dias.map(d => d.n));
  document.getElementById("semana").innerHTML = `
    <div class="columnas" role="img" aria-label="${dias.map(d => `${d.nombre}: ${d.n}`).join(", ")}">
      ${dias.map((d, i) => `<span class="columna${i === 6 ? " hoy" : ""}" title="${d.nombre}: ${d.n}"><b>${d.n || ""}</b><i style="height:${Math.max(4, d.n / maxDia * 100)}%"></i><small>${d.letra}</small></span>`).join("")}
    </div>
    <p class="subtexto">${dias.reduce((a, d) => a + d.n, 0)} tickets nuevos en los últimos 7 días</p>`;

  const libres = tickets.filter(x => x.agent_id === null && x.status !== "cerrado")
    .sort((a, b) => urgencia.indexOf(a.priority) - urgencia.indexOf(b.priority));
  const zona = document.getElementById("sin-asignar");
  zona.innerHTML = !libres.length ? `<p class="vacio">No hay tickets sin asignar. ¡Bien!</p>` : `<ul class="lista-libres">${libres.map(x => `
    <li class="ticket-libre">
      <span class="codigo-ticket">${codigoTicket(x.id)}</span>
      <span class="ticket-libre-texto"><a href="soporte-ticket.html?id=${x.id}">${esc(x.subject)}</a><span class="subtexto">${esc(x.cliente.name)} · ${esc(x.categoria)} · ${fechaHora(x.created_at)}</span></span>
      ${chipPrioridad(x.priority)}
      <span>
        <label class="solo-lectores" for="asignar-${x.id}">Asignar ${codigoTicket(x.id)}</label>
        <select id="asignar-${x.id}" data-ticket="${x.id}" class="boton boton-secundario boton-pequeno">${opciones(agentes.map(a => [a.id, a.name]), "Asignar a…")}</select>
      </span>
    </li>`).join("")}</ul>`;
  zona.addEventListener("change", async e => {
    const select = e.target.closest("[data-ticket]");
    if (!select || !select.value) return;
    const ok = await accion(select, () => api.tickets.asignar(Number(select.dataset.ticket), Number(select.value)));
    if (!ok) { select.value = ""; return; }
    select.disabled = true;
    toast("ok", `${codigoTicket(select.dataset.ticket)} asignado a ${select.selectedOptions[0].text}.`);
    setTimeout(() => location.reload(), 900);
  });
});
