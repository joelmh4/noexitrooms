// Iniciar sesión. Tras entrar, vuelve a la página que pedía sesión o va al inicio de su rol.
iniciar(async yo => {
  const form = document.getElementById("form-login");
  const zonaAviso = document.getElementById("aviso-login");
  if (yo) {
    zonaAviso.innerHTML = aviso("info", `Ya has iniciado sesión como ${yo.name}.`);
  }
  if (parametro("volver")) {
    zonaAviso.innerHTML = aviso("aviso", "Inicia sesión para continuar.");
  }

  function destino(rol) {
    const volver = parametro("volver");
    // Solo aceptamos páginas de esta web (nada de enlaces externos)
    return volver && /^[a-z0-9-]+\.html(\?[\w=&%-]*)?(#[\w-]+)?$/i.test(volver) ? volver : INICIO_POR_ROL[rol];
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarErrores(form);
    zonaAviso.innerHTML = "";
    const { email, password } = form.elements;
    let valido = true;
    if (!EMAIL_VALIDO.test(email.value.trim())) { marcarError(email, "Escribe un email válido."); valido = false; }
    if (!password.value) { marcarError(password, "Escribe tu contraseña."); valido = false; }
    if (!valido) return;

    const boton = form.querySelector('[type="submit"]');
    boton.disabled = true;
    boton.textContent = "Entrando…";
    try {
      const usuario = await api.auth.login(email.value, password.value);
      location.href = destino(usuario.role);
    } catch (err) {
      zonaAviso.innerHTML = aviso("error", err.message);
      boton.disabled = false;
      boton.textContent = "Entrar";
    }
  });
});
