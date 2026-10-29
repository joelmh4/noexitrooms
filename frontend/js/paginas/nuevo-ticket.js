// Nuevo ticket (cliente)
iniciar(async () => {
  const [categorias, salas] = await Promise.all([api.categorias.listar(), api.salas.listar()]);
  const form = document.getElementById("form-ticket");
  const { subject, category_id, room_id, description } = form.elements;

  category_id.innerHTML = `<option value="">Elige una categoría</option>` +
    categorias.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  room_id.innerHTML = `<option value="">Ninguna en concreto</option>` +
    salas.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");

  // Si venimos desde la ficha de una sala, la dejamos elegida
  const desdeSala = salas.find(s => s.slug === parametro("sala"));
  if (desdeSala) {
    room_id.value = desdeSala.id;
    category_id.value = categorias.find(c => c.name.startsWith("Reservas"))?.id || "";
    subject.value = `Reserva en ${desdeSala.name}`;
  }

  // Si venimos del candado de la portada, preparamos el canje del código
  if (parametro("bono") === "NOEXIT-1974") {
    category_id.value = categorias.find(c => c.name.startsWith("Bonos"))?.id || "";
    subject.value = "Canjear código NOEXIT-1974";
    description.value = "He abierto el candado de la portada y quiero canjear el código NOEXIT-1974 (10 % de descuento en nuestra primera sala).";
  }

  // Desde "Bonos regalo" de la portada
  if (parametro("regalo")) {
    category_id.value = categorias.find(c => c.name.startsWith("Bonos"))?.id || "";
    subject.value = "Quiero regalar un bono";
  }

  const contador = document.getElementById("contador-descripcion");
  description.addEventListener("input", () => { contador.textContent = `${description.value.length} / 2000`; });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarErrores(form);
    let valido = true;
    if (subject.value.trim().length < 5) { marcarError(subject, "El asunto necesita al menos 5 caracteres."); valido = false; }
    if (!category_id.value) { marcarError(category_id, "Elige una categoría."); valido = false; }
    if (description.value.trim().length < 20) { marcarError(description, "Cuéntanos un poco más (mínimo 20 caracteres)."); valido = false; }
    if (!valido) return;

    const ticket = await api.tickets.crear({
      subject: subject.value,
      category_id: Number(category_id.value),
      room_id: room_id.value ? Number(room_id.value) : null,
      priority: form.elements.priority.value,
      description: description.value
    });
    location.href = `ticket.html?id=${ticket.id}&nuevo=1`;
  });
});
