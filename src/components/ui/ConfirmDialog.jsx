import Modal from './Modal';
import Icono from './Icono';

/**
 * Diálogo de confirmación. Reemplaza a confirm() del navegador.
 */
export default function ConfirmDialog({
  abierto,
  titulo = 'Confirmar acción',
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligroso = false,
  cargando = false,
  onConfirmar,
  onCancelar,
}) {
  const manejarConfirmacion = (event) => {
    event.preventDefault();
    onConfirmar();
  };

  const manejarCancelacion = (event) => {
    event.preventDefault();
    onCancelar();
  };

  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCancelar} ancho="max-w-lg">
      <div className="flex items-start gap-4 mb-8">
        <div
          className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
            peligroso ? 'bg-error/15 text-error' : 'bg-primary/15 text-primary'
          }`}
        >
          <Icono nombre={peligroso ? 'aviso' : 'info'} className="w-7 h-7" />
        </div>
        <p className="text-body-lg text-on-surface leading-relaxed pt-2">{mensaje}</p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={manejarCancelacion}
          disabled={cargando}
          className="btn-secundario"
        >
          {textoCancelar}
        </button>
        <button
          type="button"
          onClick={manejarConfirmacion}
          disabled={cargando}
          className={
            peligroso
              ? 'px-8 py-4 rounded-lg font-bold text-label-bold uppercase tracking-widest bg-error text-on-error hover:brightness-110 active:scale-95 transition-all disabled:opacity-40'
              : 'btn-primario'
          }
        >
          {cargando ? 'Procesando…' : textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}
