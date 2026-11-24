iniciar(() => { montarMapa(); });

function montarMapa() {
  const lienzo = document.getElementById("mapa");
  if (!lienzo || typeof L === "undefined") return;

  const local = [40.4123, -3.7045];
  lienzo.innerHTML = "";
  lienzo.classList.add("mapa-oscuro");

  const mapa = L.map(lienzo, {
    center: local, zoom: 16, minZoom: 13, maxZoom: 19,
    scrollWheelZoom: false,
    zoomControl: false,
    attributionControl: true,
  });
  L.control.zoom({ position: "bottomright", zoomInTitle: "Acercar", zoomOutTitle: "Alejar" }).addTo(mapa);
  mapa.attributionControl.setPrefix(false);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(mapa);

  const icono = L.divIcon({
    className: "marcador-local",
    iconSize: [48, 60], iconAnchor: [24, 58], popupAnchor: [0, -54],
    html: `
      <span class="marcador-pulso" aria-hidden="true"></span>
      <svg class="marcador-pin" viewBox="0 0 48 60" aria-hidden="true">
        <path d="M24 2C12.4 2 3 11.2 3 22.6 3 37.5 24 58 24 58s21-20.5 21-35.4C45 11.2 35.6 2 24 2Z"/>
        <g class="marcador-candado">
          <rect x="16" y="21" width="16" height="13" rx="2.5"/>
          <path d="M19 21v-3.5a5 5 0 0 1 10 0V21" fill="none"/>
          <circle cx="24" cy="27.5" r="1.8"/>
        </g>
      </svg>`,
  });

  L.marker(local, { icon: icono, title: "NoExitRooms", keyboard: true }).addTo(mapa)
    .bindPopup(`
      <span class="etiqueta-superior">Estáis aquí. Casi.</span>
      <strong class="popup-titulo">NoExitRooms</strong>
      <span>Calle del Candado 13, 28012 Madrid</span>
      <span class="popup-metro"><b>M</b> Tirso de Molina · Línea 1</span>`,
      { className: "popup-local", closeButton: false, maxWidth: 260 })
    .openPopup();
  mapa.panBy([0, -90], { animate: false });

  mapa.on("click", () => mapa.scrollWheelZoom.enable());
  mapa.on("mouseout", () => mapa.scrollWheelZoom.disable());
}
