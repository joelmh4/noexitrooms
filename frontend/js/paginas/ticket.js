// Detalle de ticket (cliente). Solo ve sus tickets y nunca las notas internas.
iniciar(async () => {
  const id = Number(parametro("id"));
  const zona = document.getElementById("ticket");

  let recienEnviado = false;
  async function cargar() {
    let t;
    try {
      t = await api.tickets.obtener(id);
    } catch (err) {
      zona.innerHTML = `${aviso("error", err.message)}<a class="boton boton-secundario" href="mis-tickets.html">Volver a mis tickets</a>`;
      return;
    }
    document.title = `${codigoTicket(t.id)} · NoExitRooms`;

    let acciones = "";
    if (t.status === "resuelto") {
      acciones = `
        ${aviso("info", "El equipo ha marcado el ticket como resuelto. ¿Está todo bien?")}
        <button class="boton boton-primario boton-bloque" data-estado="cerrado">Sí, cerrar el ticket</button>
        <button class="boton boton-secundario boton-bloque" data-estado="abierto">No, sigue sin resolver</button>`;
    } else if (t.status === "cerrado") {
      acciones = `<button class="boton boton-secundario boton-bloque" data-estado="abierto">Pedir reapertura</button>`;
    }

    zona.innerHTML = `
      <a href="mis-tickets.html" class="subtexto">← Mis tickets</a>
      <div class="cabecera-pagina">
        <div class="pila" style="gap:6px">
          <span class="codigo-ticket">${codigoTicket(t.id)}</span>
          <h1 style="font-size:1.8rem">${esc(t.subject)}</h1>
        </div>
        ${chipEstado(t.status)}
      </div>
      ${t.status === "pendiente_cliente" ? aviso("aviso", "El equipo está esperando tu respuesta para seguir.") : ""}
      <div class="detalle">
        <div class="pila">
          <section class="tarjeta">
            <h2 class="tarjeta-titulo">Conversación</h2>
            <div class="historial">${historialTicket(t, false)}</div>
          </section>
          ${t.status !== "cerrado" ? `
          <form class="tarjeta formulario" id="form-respuesta" novalidate>
            <div class="campo">
              <label for="respuesta">Responder</label>
              <textarea id="respuesta" name="respuesta" maxlength="2000" placeholder="Escribe tu mensaje…"></textarea>
            </div>
            <div class="fila" style="justify-content:flex-end"><button class="boton boton-primario" type="submit">${icono("send")} Enviar</button></div>
          </form>` : aviso("info", "Este ticket está cerrado. Si necesitas algo más, pide la reapertura.")}
        </div>
        <aside class="tarjeta">
          <h2 class="tarjeta-titulo">Datos del ticket</h2>
          <dl class="datos-ticket">
            <dt>Estado</dt><dd>${chipEstado(t.status)}</dd>
            <dt>Prioridad</dt><dd>${chipPrioridad(t.priority)}</dd>
            <dt>Categoría</dt><dd>${esc(t.categoria)}</dd>
            ${t.sala ? `<dt>Sala</dt><dd><a href="sala.html?slug=${encodeURIComponent(t.sala.slug)}">${esc(t.sala.name)}</a></dd>` : ""}
            <dt>Atendido por</dt><dd>${t.agente ? esc(t.agente.name) : "Pendiente de asignar"}</dd>
            <dt>Creado</dt><dd>${fechaHora(t.created_at)}</dd>
            <dt>Actualizado</dt><dd>${fechaHora(t.updated_at)}</dd>
          </dl>
          ${acciones}
        </aside>
      </div>`;

    zona.querySelector("#form-respuesta")?.addEventListener("submit", async e => {
      e.preventDefault();
      const caja = e.target.elements.respuesta;
      limpiarErrores(e.target);
      if (!caja.value.trim()) { marcarError(caja, "Escribe un mensaje antes de enviar."); return; }
      await api.tickets.responder(id, caja.value);
      recienEnviado = true;
      toast("ok", "Mensaje enviado.");
      cargar();
    });
    zona.querySelectorAll("[data-estado]").forEach(b => b.addEventListener("click", async () => {
      const nuevo = b.dataset.estado;
      const ok = nuevo === "cerrado"
        ? await confirmar("Cerrar el ticket", "Si lo cierras ya no podrás escribir en él, aunque podrás pedir reabrirlo.", "Cerrar ticket")
        : await confirmar("Reabrir el ticket", "El equipo volverá a revisarlo. Cuéntanos qué falta en un mensaje.", "Reabrir");
      if (!ok) return;
      await api.tickets.cambiarEstado(id, nuevo);
      toast("ok", nuevo === "cerrado" ? "Ticket cerrado. ¡Gracias!" : "Ticket reabierto.");
      cargar();
    }));
    // El mensaje que acabas de enviar llega desde la caja de respuesta
    if (recienEnviado) { [...zona.querySelectorAll(".mensaje")].pop()?.classList.add("recien"); recienEnviado = false; }
    pintarIconos();
  }

  if (parametro("nuevo")) toast("ok", "Ticket creado. Te responderemos lo antes posible.");
  await cargar();
});
