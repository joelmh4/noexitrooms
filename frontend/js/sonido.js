/* =====================================================================
   Sonido de la portada (opcional, apagado al entrar).
   Todo se genera con Web Audio: no hay archivos de sonido.
   - ambiente: zumbido grave de fluorescente + ruido de sala vacía
   - clic: el interruptor de la linterna
   - tic: una rueda del candado
   - abrir: el candado se abre
   - susurro: algo se mueve en la oscuridad (San Tomás)
   El navegador solo deja sonar después de un clic, por eso se activa
   con el botón del altavoz.
   ===================================================================== */

const sonido = (() => {
  let ctx = null, general = null, ambiente = null;
  let activo = false;

  function preparar() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    general = ctx.createGain();
    general.gain.value = 0.9;
    general.connect(ctx.destination);
  }

  // Ruido blanco reutilizable (1 s)
  let bufferRuido = null;
  function ruido() {
    if (!bufferRuido) {
      bufferRuido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const datos = bufferRuido.getChannelData(0);
      for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
    }
    const fuente = ctx.createBufferSource();
    fuente.buffer = bufferRuido;
    return fuente;
  }

  function empezarAmbiente() {
    const salida = ctx.createGain();
    salida.gain.value = 0;
    salida.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
    salida.connect(general);

    // Zumbido de 50 Hz y armónico, como un fluorescente viejo
    const zumbido = ctx.createGain();
    zumbido.gain.value = 0.025;
    zumbido.connect(salida);
    const osciladores = [50, 100, 150].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i ? "sine" : "triangle";
      o.frequency.value = f + (i === 2 ? 0.7 : 0);
      const g = ctx.createGain();
      g.gain.value = [1, 0.5, 0.25][i];
      o.connect(g).connect(zumbido);
      o.start();
      return o;
    });

    // Aire de sala cerrada: ruido muy filtrado
    const aire = ruido();
    aire.loop = true;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 400;
    const g = ctx.createGain();
    g.gain.value = 0.035;
    aire.connect(filtro).connect(g).connect(salida);
    aire.start();

    ambiente = { salida, fuentes: [...osciladores, aire] };
  }

  function pararAmbiente() {
    if (!ambiente) return;
    const { salida, fuentes } = ambiente;
    salida.gain.cancelScheduledValues(ctx.currentTime);
    salida.gain.setValueAtTime(salida.gain.value, ctx.currentTime);
    salida.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    fuentes.forEach(f => f.stop(ctx.currentTime + 0.45));
    ambiente = null;
  }

  // Golpe corto de ruido filtrado (clics, tics)
  function golpe({ frecuencia = 2000, q = 4, volumen = 0.3, duracion = 0.04, retraso = 0 }) {
    if (!activo) return;
    const t = ctx.currentTime + retraso;
    const f = ruido();
    const filtro = ctx.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = frecuencia;
    filtro.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(volumen, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duracion);
    f.connect(filtro).connect(g).connect(general);
    f.start(t, Math.random() * 0.5);
    f.stop(t + duracion + 0.02);
  }

  function tono(frecuencia, { volumen = 0.15, duracion = 0.3, retraso = 0, tipo = "sine" } = {}) {
    if (!activo) return;
    const t = ctx.currentTime + retraso;
    const o = ctx.createOscillator();
    o.type = tipo;
    o.frequency.value = frecuencia;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volumen, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    o.connect(g).connect(general);
    o.start(t);
    o.stop(t + duracion + 0.05);
  }

  return {
    get activo() { return activo; },
    alternar() {
      try {
        preparar();
        activo = !activo;
        if (activo) { ctx.resume(); empezarAmbiente(); this.clic(); }
        else pararAmbiente();
      } catch { activo = false; }
      return activo;
    },
    clic() { golpe({ frecuencia: 3200, q: 2, volumen: 0.45, duracion: 0.03 }); golpe({ frecuencia: 900, q: 3, volumen: 0.25, duracion: 0.05, retraso: 0.035 }); },
    tic() { golpe({ frecuencia: 4200, q: 8, volumen: 0.18, duracion: 0.025 }); },
    abrir() {
      golpe({ frecuencia: 700, q: 2, volumen: 0.5, duracion: 0.12 });
      golpe({ frecuencia: 2500, q: 3, volumen: 0.3, duracion: 0.06, retraso: 0.12 });
      [523, 659, 784, 1047].forEach((f, i) => tono(f, { volumen: 0.08, duracion: 0.9, retraso: 0.2 + i * 0.09, tipo: "triangle" }));
    },
    susurro() {
      if (!activo) return;
      const t = ctx.currentTime;
      const f = ruido();
      const filtro = ctx.createBiquadFilter();
      filtro.type = "bandpass";
      filtro.frequency.setValueAtTime(1800, t);
      filtro.frequency.linearRampToValueAtTime(900, t + 1.2);
      filtro.Q.value = 6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + 1.3);
      f.connect(filtro).connect(g).connect(general);
      f.start(t);
      f.stop(t + 1.35);
    }
  };
})();
