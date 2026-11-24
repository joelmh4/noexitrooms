iniciar(async yo => {
  const form = document.getElementById("form-login");
  const zonaAviso = document.getElementById("aviso-login");
  const volver = parametro("volver");
  if (yo) zonaAviso.innerHTML = aviso("info", `Ya has iniciado sesión como ${yo.name}.`);
  if (volver) zonaAviso.innerHTML = aviso("aviso", "Inicia sesión para continuar.");

  const destino = rol => volver && /^[a-z0-9-]+\.html(\?[\w=&%-]*)?(#[\w-]+)?$/i.test(volver) ? volver : INICIO_POR_ROL[rol];

  form.querySelectorAll("[data-cuenta]").forEach(b => b.addEventListener("click", () => {
    form.elements.email.value = b.dataset.cuenta;
    form.elements.password.value = "Demo1234!";
    form.querySelector('[type="submit"]').focus();
  }));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    zonaAviso.innerHTML = "";
    const { email, password } = form.elements;
    if (!validar(form, [
      [!EMAIL_VALIDO.test(email.value.trim()), email, "Escribe un email válido."],
      [!password.value, password, "Escribe tu contraseña."]
    ])) return;

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
