iniciar(async yo => {
  const [tickets, reservas] = await Promise.all([api.tickets.listar(), api.reservas.mias()]);
  pintarReservas(reservas);
  const filtros = document.getElementById("filtros-estado");
  const lista = document.getElementById("lista");
  let filtro = "todos";

  if (parametro("bienvenida")) toast("ok", `Cuenta creada. ¡Bienvenido/a, ${yo.name.split(" ")[0]}!`);

  const pendientes = tickets.filter(t => t.status === "pendiente_cliente").length;
  if (pendientes) {
    document.getElementById("aviso-pendientes").innerHTML = aviso("aviso",
      pendientes === 1 ? "Tienes 1 ticket esperando tu respuesta." : `Tienes ${pendientes} tickets esperando tu respuesta.`);
  }

  const opciones = [["todos", "Todos"], ...Object.entries(ESTADOS)];
  function pintar() {
    filtros.innerHTML = opciones.map(([valor, texto]) => {
      const n = valor === "todos" ? tickets.length : tickets.filter(t => t.status === valor).length;
      return `<button class="boton boton-secundario boton-pequeno" type="button" data-filtro="${valor}" aria-pressed="${valor === filtro}">${texto} (${n})</button>`;
    }).join("");
    const visibles = filtro === "todos" ? tickets : tickets.filter(t => t.status === filtro);
    lista.innerHTML = tickets.length
      ? tablaTickets(visibles, { enlace: "ticket.html", columnas: ["codigo", "asunto", "estado", "prioridad", "fecha"] })
      : `<div class="tarjeta vacio">Todavía no has abierto ningún ticket. <a href="nuevo-ticket.html">Abre el primero</a>.</div>`;
  }
  filtros.addEventListener("click", e => {
    const b = e.target.closest("[data-filtro]");
    if (b) { filtro = b.dataset.filtro; pintar(); }
  });
  pintar();
});

function pintarReservas(reservas) {
  const ahora = ahoraIso();
  const proximas = reservas.filter(r => r.starts_at.slice(0, 16) >= ahora && r.status !== "cancelada").reverse();
  if (!proximas.length) return;
  document.getElementById("mis-reservas").innerHTML = `
    <h2 class="tarjeta-titulo">Tus próximas reservas</h2>
    <div class="lista-reservas">${proximas.map(r => `
      <div class="tarjeta reserva-mini">
        <a href="sala.html?slug=${encodeURIComponent(r.sala.slug)}"><b>${esc(r.sala.name)}</b></a>
        <span>${new Date(r.starts_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · ${r.starts_at.slice(11, 16)} · ${r.players} jugadores</span>
        <div class="fila-entre">
          ${pastilla(r.status === "confirmada", r.status === "confirmada" ? "Confirmada" : "Pendiente de confirmar")}
          <button class="boton-enlace" type="button" data-cancelar="${r.id}">Cancelar</button>
        </div>
      </div>`).join("")}</div>`;
}

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-cancelar]");
  if (!b) return;
  if (!await confirmar("Cancelar reserva", "Dejaréis libre el hueco para otros jugadores.", "Cancelar reserva", true)) return;
  if (!await accion(b, () => api.reservas.cambiarEstado(Number(b.dataset.cancelar), "cancelada"))) return;
  toast("ok", "Reserva cancelada.");
  b.closest(".reserva-mini").remove();
});
