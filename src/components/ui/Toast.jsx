import Icono from './Icono';

const ESTILOS = {
  exito: {
    contenedor: 'border-success/60 bg-success-container',
    icono: 'text-success',
    nombreIcono: 'checkCirculo',
  },
  error: {
    contenedor: 'border-error/60 bg-error-container/40',
    icono: 'text-error',
    nombreIcono: 'aviso',
  },
  info: {
    contenedor: 'border-primary/60 bg-surface-container-high',
    icono: 'text-primary',
    nombreIcono: 'info',
  },
};

export default function Toast({ mensaje, tipo = 'info', onCerrar }) {
  const estilo = ESTILOS[tipo] ?? ESTILOS.info;

  const manejarCierre = (event) => {
    event.preventDefault();
    onCerrar();
  };

  return (
    <div
      className={`flex items-start gap-3 min-w-[28rem] max-w-[40rem] px-5 py-4 rounded-xl border shadow-2xl animate-slide-in-right ${estilo.contenedor}`}
    >
      <Icono nombre={estilo.nombreIcono} className={`w-6 h-6 shrink-0 ${estilo.icono}`} />
      <p className="flex-1 text-body-md text-on-surface">{mensaje}</p>
      <button
        type="button"
        onClick={manejarCierre}
        className="text-tertiary hover:text-on-surface transition-colors shrink-0"
        aria-label="Cerrar aviso"
      >
        <Icono nombre="cerrar" className="w-5 h-5" />
      </button>
    </div>
  );
}
