// Gestión de un ticket (agente y admin): responder, notas internas, estado, prioridad y asignación
iniciar(async yo => {
  const id = Number(parametro("id"));
  const zona = document.getElementById("ticket");
  const volver = yo.role === "admin" ? ["admin-tickets.html", "Todos los tickets"] : ["soporte.html", "Mis tickets"];
  const agentes = await api.usuarios.agentes();

  let recienEnviado = false;
  async function cargar() {
    let t;
    try {
      t = await api.tickets.obtener(id);
    } catch (err) {
      zona.innerHTML = `${aviso("error", err.message)}<a class="boton boton-secundario" href="${volver[0]}">Volver</a>`;
      return;
    }
    document.title = `${codigoTicket(t.id)} · Soporte · NoExitRooms`;
    const puedeEditar = yo.role === "admin" || t.agent_id === yo.id;
    // El agente no cierra tickets: lo hace el cliente al confirmar o un admin
    const estadosPermitidos = Object.entries(ESTADOS).filter(([v]) => yo.role === "admin" || v !== "cerrado" || t.status === "cerrado");

    let asignacion;
    if (yo.role === "admin") {
      asignacion = `
        <div class="campo">
          <label for="agente">Agente asignado</label>
          <select id="agente">
            <option value="">Sin asignar</option>
            ${agentes.map(a => `<option value="${a.id}"${a.id === t.agent_id ? " selected" : ""}>${esc(a.name)}</option>`).join("")}
          </select>
        </div>`;
    } else if (t.agent_id === null) {
      asignacion = `<button class="boton boton-primario boton-bloque" id="quedarmelo">${icono("hand")} Quedármelo</button>`;
    } else {
      asignacion = `<dl class="datos-ticket"><dt>Agente</dt><dd>${esc(t.agente.name)}</dd></dl>`;
    }

    zona.innerHTML = `
      <a href="${volver[0]}" class="subtexto">← ${volver[1]}</a>
      <div class="cabecera-pagina">
        <div class="pila" style="gap:6px">
          <span class="codigo-ticket">${codigoTicket(t.id)} · ${esc(t.categoria)}</span>
          <h1 style="font-size:1.8rem">${esc(t.subject)}</h1>
        </div>
        <div class="fila">${chipPrioridad(t.priority)} ${chipEstado(t.status)}</div>
      </div>
      ${!puedeEditar ? aviso("info", "Este ticket está sin asignar. Quédatelo para poder responder y cambiar su estado.") : ""}
      <div class="detalle">
        <div class="pila">
          <section class="tarjeta">
            <h2 class="tarjeta-titulo">Historial</h2>
            <div class="historial">${historialTicket(t, true)}</div>
          </section>
          ${puedeEditar && t.status !== "cerrado" ? `
          <form class="tarjeta formulario" id="form-respuesta" novalidate>
            <div class="campo">
              <label for="respuesta">Responder al cliente</label>
              <textarea id="respuesta" name="respuesta" maxlength="2000" placeholder="Escribe la respuesta…"></textarea>
            </div>
            <div class="fila-entre">
              <label class="casilla"><input type="checkbox" name="interna"> Nota interna (el cliente no la ve)</label>
              <button class="boton boton-primario" type="submit">${icono("send")} Enviar</button>
            </div>
          </form>` : ""}
        </div>
        <aside class="pila">
          <section class="tarjeta">
            <h2 class="tarjeta-titulo">Cliente</h2>
            <div class="fila"><span class="avatar">${esc(iniciales(t.cliente.name))}</span><strong>${esc(t.cliente.name)}</strong></div>
            <dl class="datos-ticket">
              ${t.sala ? `<dt>Sala</dt><dd>${esc(t.sala.name)}</dd>` : ""}
              <dt>Creado</dt><dd>${fechaHora(t.created_at)}</dd>
              <dt>Actualizado</dt><dd>${fechaHora(t.updated_at)}</dd>
            </dl>
          </section>
          <section class="tarjeta formulario">
            <h2 class="tarjeta-titulo">Gestión</h2>
            ${asignacion}
            <div class="campo">
              <label for="estado">Estado</label>
              <select id="estado"${puedeEditar ? "" : " disabled"}>
                ${estadosPermitidos.map(([v, txt]) => `<option value="${v}"${v === t.status ? " selected" : ""}>${txt}</option>`).join("")}
              </select>
            </div>
            <div class="campo">
              <label for="prioridad">Prioridad</label>
              <select id="prioridad"${puedeEditar ? "" : " disabled"}>
                ${Object.entries(PRIORIDADES).map(([v, txt]) => `<option value="${v}"${v === t.priority ? " selected" : ""}>${txt}</option>`).join("")}
              </select>
            </div>
          </section>
        </aside>
      </div>`;

    // Cada cambio se guarda al momento y recarga el ticket
    async function guardar(accion, mensaje) {
      try {
        await accion();
        toast("ok", mensaje);
      } catch (err) {
        toast("error", err.message);
      }
      cargar();
    }
    zona.querySelector("#estado").addEventListener("change", e =>
      guardar(() => api.tickets.cambiarEstado(id, e.target.value), `Estado cambiado a ${ESTADOS[e.target.value]}.`));
    zona.querySelector("#prioridad").addEventListener("change", e =>
      guardar(() => api.tickets.cambiarPrioridad(id, e.target.value), `Prioridad cambiada a ${PRIORIDADES[e.target.value]}.`));
    zona.querySelector("#agente")?.addEventListener("change", e =>
      guardar(() => api.tickets.asignar(id, Number(e.target.value) || null), e.target.value ? "Ticket asignado." : "Ticket sin asignar."));
    zona.querySelector("#quedarmelo")?.addEventListener("click", () =>
      guardar(() => api.tickets.asignar(id, yo.id), "Ahora el ticket es tuyo."));
    zona.querySelector("#form-respuesta")?.addEventListener("submit", async e => {
      e.preventDefault();
      const { respuesta, interna } = e.target.elements;
      limpiarErrores(e.target);
      if (!respuesta.value.trim()) { marcarError(respuesta, "Escribe un mensaje antes de enviar."); return; }
      recienEnviado = true;
      await guardar(() => api.tickets.responder(id, respuesta.value, interna.checked), interna.checked ? "Nota interna guardada." : "Respuesta enviada.");
    });
    // El mensaje que acabas de enviar llega desde la caja de respuesta
    if (recienEnviado) { [...zona.querySelectorAll(".mensaje")].pop()?.classList.add("recien"); recienEnviado = false; }
    pintarIconos();
  }
  await cargar();
});
