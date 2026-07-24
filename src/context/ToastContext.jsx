import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from '../components/ui/Toast';

const ToastContext = createContext(null);

/**
 * Sistema de avisos visuales. Sustituye por completo a alert() y a
 * cualquier notificación nativa del navegador.
 */
export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const cerrarAviso = useCallback((id) => {
    setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id));
  }, []);

  const mostrarAviso = useCallback(
    (mensaje, tipo = 'info', duracion = 4000) => {
      const id = crypto.randomUUID();
      setAvisos((actuales) => [...actuales, { id, mensaje, tipo }]);
      window.setTimeout(() => cerrarAviso(id), duracion);
      return id;
    },
    [cerrarAviso]
  );

  const valor = useMemo(
    () => ({
      exito: (mensaje) => mostrarAviso(mensaje, 'exito'),
      error: (mensaje) => mostrarAviso(mensaje, 'error', 6000),
      info: (mensaje) => mostrarAviso(mensaje, 'info'),
    }),
    [mostrarAviso]
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-[calc(100vw-3rem)]"
        role="status"
        aria-live="polite"
      >
        {avisos.map((aviso) => (
          <Toast
            key={aviso.id}
            mensaje={aviso.mensaje}
            tipo={aviso.tipo}
            onCerrar={() => cerrarAviso(aviso.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de un ToastProvider.');
  }
  return contexto;
}
