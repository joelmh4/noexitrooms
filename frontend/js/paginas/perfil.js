iniciar(async yo => {
  const formDatos = document.getElementById("form-datos");
  const formPass = document.getElementById("form-password");
  formDatos.elements.name.value = yo.name;
  formDatos.elements.email.value = yo.email;
  document.getElementById("avatar-perfil").textContent = iniciales(yo.name);

  formDatos.addEventListener("submit", async e => {
    e.preventDefault();
    const { name, email } = formDatos.elements;
    if (!validar(formDatos, [
      [name.value.trim().length < 2, name, "Escribe tu nombre."],
      [!EMAIL_VALIDO.test(email.value.trim()), email, "Escribe un email válido."]
    ])) return;
    try {
      await api.perfil.actualizar({ name: name.value, email: email.value });
      toast("ok", "Datos guardados.");
    } catch (err) {
      marcarError(email, err.message);
    }
  });

  formPass.addEventListener("submit", async e => {
    e.preventDefault();
    const { actual, nueva, repetir } = formPass.elements;
    if (!validar(formPass, [
      [!actual.value, actual, "Escribe tu contraseña actual."],
      [!claveValida(nueva.value), nueva, "Mínimo 8 caracteres y al menos un número."],
      [repetir.value !== nueva.value, repetir, "Las contraseñas no coinciden."]
    ])) return;
    try {
      await api.perfil.cambiarPassword(actual.value, nueva.value);
      formPass.reset();
      toast("ok", "Contraseña cambiada.");
    } catch (err) {
      marcarError(actual, err.message);
    }
  });
});
