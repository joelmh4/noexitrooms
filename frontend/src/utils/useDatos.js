// Hook para cargar datos de la API al abrir una página:
//   const { datos, error, cargando, recargar } = useDatos(() => api.salas.listar(), [dependencias]);
import { useCallback, useEffect, useState } from "react";

export function useDatos(cargar, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pedir = useCallback(cargar, dependencias);

  const recargar = useCallback(async () => {
    try {
      const datos = await pedir();
      setEstado({ datos, error: null, cargando: false });
    } catch (error) {
      setEstado({ datos: null, error, cargando: false });
    }
  }, [pedir]);

  useEffect(() => {
    setEstado(e => ({ ...e, cargando: true }));
    recargar();
  }, [recargar]);

  return { ...estado, recargar };
}
