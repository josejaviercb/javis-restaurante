import { useEffect } from 'react';
import Icono from './Icono';

/**
 * Ventana modal con el estilo brutalista de la web.
 * Sustituye a cualquier diálogo nativo del navegador.
 */
export default function Modal({ abierto, titulo, onCerrar, children, ancho = 'max-w-2xl' }) {
  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierta.
  useEffect(() => {
    if (!abierto) return undefined;

    const manejarTecla = (event) => {
      if (event.key === 'Escape') onCerrar();
    };

    document.addEventListener('keydown', manejarTecla);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const manejarCierre = (event) => {
    event.preventDefault();
    onCerrar();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={manejarCierre}
      />
      <div
        className={`relative w-full ${ancho} bg-surface border-4 border-primary-container rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col`}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b-2 border-surface-variant shrink-0">
          <h2 className="font-headline text-headline-md text-primary uppercase">{titulo}</h2>
          <button
            type="button"
            onClick={manejarCierre}
            className="text-tertiary hover:text-primary transition-colors"
            aria-label="Cerrar ventana"
          >
            <Icono nombre="cerrar" className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
