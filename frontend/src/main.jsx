import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { AvisosProvider } from "./context/Avisos";
import "./css/estilos.css";
import "./css/panel.css";
import "./css/inicio.css";
import "./css/sala.css";
import "./css/equipo.css";

// basename: en GitHub Pages la web cuelga de /noexitrooms/ (ver vite.config.js)
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AvisosProvider>
          <App />
        </AvisosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
