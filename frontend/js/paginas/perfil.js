// Mi perfil (cliente): datos personales y cambio de contraseña
iniciar(async yo => {
  const formDatos = document.getElementById("form-datos");
  const formPass = document.getElementById("form-password");
  formDatos.elements.name.value = yo.name;
  formDatos.elements.email.value = yo.email;
  document.getElementById("avatar-perfil").textContent = iniciales(yo.name);

  formDatos.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarErrores(formDatos);
    const { name, email } = formDatos.elements;
    let valido = true;
    if (name.value.trim().length < 2) { marcarError(name, "Escribe tu nombre."); valido = false; }
    if (!EMAIL_VALIDO.test(email.value.trim())) { marcarError(email, "Escribe un email válido."); valido = false; }
    if (!valido) return;
    try {
      await api.perfil.actualizar({ name: name.value, email: email.value });
      toast("ok", "Datos guardados.");
    } catch (err) {
      marcarError(email, err.message);
    }
  });

  formPass.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarErrores(formPass);
    const { actual, nueva, repetir } = formPass.elements;
    let valido = true;
    if (!actual.value) { marcarError(actual, "Escribe tu contraseña actual."); valido = false; }
    if (nueva.value.length < 8 || !/\d/.test(nueva.value)) { marcarError(nueva, "Mínimo 8 caracteres y al menos un número."); valido = false; }
    if (repetir.value !== nueva.value) { marcarError(repetir, "Las contraseñas no coinciden."); valido = false; }
    if (!valido) return;
    try {
      await api.perfil.cambiarPassword(actual.value, nueva.value);
      formPass.reset();
      toast("ok", "Contraseña cambiada.");
    } catch (err) {
      marcarError(actual, err.message);
    }
  });
});
