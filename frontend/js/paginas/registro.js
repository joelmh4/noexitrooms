iniciar(async () => {
  const form = document.getElementById("form-registro");
  const zonaAviso = document.getElementById("aviso-registro");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    zonaAviso.innerHTML = "";
    const { name, email, password, repetir, condiciones } = form.elements;
    const valido = validar(form, [
      [name.value.trim().length < 2, name, "Escribe tu nombre."],
      [!EMAIL_VALIDO.test(email.value.trim()), email, "Escribe un email válido."],
      [!claveValida(password.value), password, "Mínimo 8 caracteres y al menos un número."],
      [repetir.value !== password.value, repetir, "Las contraseñas no coinciden."]
    ]);
    if (!condiciones.checked) zonaAviso.innerHTML = aviso("error", "Tienes que aceptar las condiciones de uso.");
    if (!valido || !condiciones.checked) return;

    try {
      await api.auth.registro({ name: name.value, email: email.value, password: password.value });
      location.href = "mis-tickets.html?bienvenida=1";
    } catch (err) {
      if (err.status === 409) marcarError(email, err.message);
      else zonaAviso.innerHTML = aviso("error", err.message);
    }
  });
});
