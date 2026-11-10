// Sesión del usuario para toda la web: quién ha entrado y con qué rol.
// El token lo guarda api.js; aquí solo se guarda el usuario en el estado de React
// para que la cabecera, los menús y las rutas protegidas se actualicen solos.
import { createContext, useContext, useEffect, useState } from "react";
import { api, alCambiarSesion, usuarioGuardado } from "../api/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(usuarioGuardado);

  // Si api.js cierra la sesión (por ejemplo, con un 401), React se entera aquí
  useEffect(() => alCambiarSesion(setUsuario), []);

  const valor = {
    usuario,
    login: (email, password) => api.auth.login(email, password),
    registro: datos => api.auth.registro(datos),
    actualizarPerfil: datos => api.perfil.actualizar(datos),
    logout: () => api.auth.cerrarSesion()
  };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
