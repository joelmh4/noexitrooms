iniciar(async yo => {
  const [categorias, salas] = await Promise.all([api.categorias.listar(), api.salas.listar()]);
  const form = document.getElementById("form-ticket");
  if (yo.role === "admin") document.getElementById("cancelar").href = "admin-tickets.html";
  const { subject, category_id, room_id, priority, description } = form.elements;
  const categoria = inicio => categorias.find(c => c.name.startsWith(inicio))?.id || "";

  category_id.innerHTML = opciones(categorias.map(c => [c.id, c.name]), "Elige una categoría");
  room_id.innerHTML = opciones(salas.map(s => [s.id, s.name]), "Ninguna en concreto");

  const desdeSala = salas.find(s => s.slug === parametro("sala"));
  if (desdeSala) {
    room_id.value = desdeSala.id;
    category_id.value = categoria("Reservas");
    subject.value = `Reserva en ${desdeSala.name}`;
  }
  if (parametro("bono") === "NOEXIT-1974") {
    category_id.value = categoria("Bonos");
    subject.value = "Canjear código NOEXIT-1974";
    description.value = "He abierto el candado de la portada y quiero canjear el código NOEXIT-1974 (10 % de descuento en nuestra primera sala).";
  }
  if (parametro("regalo")) {
    category_id.value = categoria("Bonos");
    subject.value = "Quiero regalar un bono";
  }

  const contador = document.getElementById("contador-descripcion");
  description.addEventListener("input", () => { contador.textContent = `${description.value.length} / 2000`; });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validar(form, [
      [subject.value.trim().length < 5, subject, "El asunto necesita al menos 5 caracteres."],
      [!category_id.value, category_id, "Elige una categoría."],
      [description.value.trim().length < 20, description, "Cuéntanos un poco más (mínimo 20 caracteres)."]
    ])) return;

    let ticket;
    const ok = await accion(form.querySelector('[type="submit"]'), async () => {
      ticket = await api.tickets.crear({
        subject: subject.value,
        category_id: Number(category_id.value),
        room_id: room_id.value ? Number(room_id.value) : null,
        priority: priority.value,
        description: description.value
      });
    });
    if (!ok) return;
    const pagina = yo.role === "admin" ? "soporte-ticket.html" : "ticket.html";
    location.href = `${pagina}?id=${ticket.id}&nuevo=1`;
  });
});
