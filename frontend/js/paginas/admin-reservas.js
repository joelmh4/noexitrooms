const ESTADOS_RESERVA = { pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada" };

iniciar(async () => {
  const form = document.getElementById("filtros");
  const lista = document.getElementById("lista");
  const ahora = ahoraIso();
  let reservas = await api.reservas.listar();

  function pintar() {
    const estado = form.elements.estado.value;
    const pasadas = form.elements.pasadas.checked;
    const visibles = reservas.filter(r => (!estado || r.status === estado) && (pasadas || r.starts_at.slice(0, 16) >= ahora));
    document.getElementById("contador").textContent = visibles.length === 1 ? "1 reserva" : `${visibles.length} reservas`;
    if (!visibles.length) {
      lista.innerHTML = `<div class="tabla-envoltorio"><p class="vacio">No hay reservas que coincidan.</p></div>`;
      return;
    }
    lista.innerHTML = tabla(
      ["Día y hora", "Sala", "Cliente", "Jugadores", "Estado", COLUMNA_ACCIONES],
      visibles.map(r => {
        const futura = r.starts_at.slice(0, 16) >= ahora;
        return `
        <tr>
          <td data-etiqueta="Día y hora" class="celda-principal"><strong>${new Date(r.starts_at).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} · ${r.starts_at.slice(11, 16)}</strong></td>
          <td data-etiqueta="Sala">${esc(r.sala.name)}</td>
          <td data-etiqueta="Cliente">${esc(r.cliente.name)}</td>
          <td data-etiqueta="Jugadores">${r.players}</td>
          <td data-etiqueta="Estado">${pastilla(r.status === "confirmada", ESTADOS_RESERVA[r.status])}</td>
          <td class="celda-acciones"><div class="acciones">
            ${r.status === "pendiente" && futura ? `<button class="boton boton-primario boton-pequeno" data-reserva="${r.id}" data-estado="confirmada">Confirmar</button>` : ""}
            ${r.status !== "cancelada" && futura ? `<button class="boton boton-secundario boton-pequeno" data-reserva="${r.id}" data-estado="cancelada">Cancelar</button>` : ""}
          </div></td>
        </tr>`;
      }).join(""));
  }

  lista.addEventListener("click", async e => {
    const b = e.target.closest("[data-reserva]");
    if (!b) return;
    const cancelar = b.dataset.estado === "cancelada";
    if (cancelar && !await confirmar("Cancelar reserva", "El hueco quedará libre para otros clientes.", "Cancelar reserva", true)) return;
    if (!await accion(b, () => api.reservas.cambiarEstado(Number(b.dataset.reserva), b.dataset.estado))) return;
    toast("ok", cancelar ? "Reserva cancelada." : "Reserva confirmada.");
    reservas = await api.reservas.listar();
    pintar();
  });
  form.addEventListener("input", pintar);
  form.addEventListener("submit", e => e.preventDefault());
  pintar();
});
