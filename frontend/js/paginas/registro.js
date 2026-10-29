// Registro: siempre crea una cuenta de cliente
iniciar(async () => {
  const form = document.getElementById("form-registro");
  const zonaAviso = document.getElementById("aviso-registro");
  // La llave y la cerradura del panel de la izquierda (js/acceso-escena.js)
  const escena = montarEscenaAcceso();

  form.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarErrores(form);
    zonaAviso.innerHTML = "";
    const { name, email, password, repetir, condiciones } = form.elements;
    let valido = true;
    if (name.value.trim().length < 2) { marcarError(name, "Escribe tu nombre."); valido = false; }
    if (!EMAIL_VALIDO.test(email.value.trim())) { marcarError(email, "Escribe un email válido."); valido = false; }
    if (password.value.length < 8 || !/\d/.test(password.value)) { marcarError(password, "Mínimo 8 caracteres y al menos un número."); valido = false; }
    if (repetir.value !== password.value) { marcarError(repetir, "Las contraseñas no coinciden."); valido = false; }
    if (!condiciones.checked) { zonaAviso.innerHTML = aviso("error", "Tienes que aceptar las condiciones de uso."); valido = false; }
    if (!valido) { escena?.fallar(); return; }

    try {
      await api.auth.registro({ name: name.value, email: email.value, password: password.value });
      await escena?.abrir("BIENVENIDO DENTRO");
      location.href = "mis-tickets.html?bienvenida=1";
    } catch (err) {
      if (err.status === 409) marcarError(email, err.message);
      else zonaAviso.innerHTML = aviso("error", err.message);
      escena?.fallar();
    }
  });
});
