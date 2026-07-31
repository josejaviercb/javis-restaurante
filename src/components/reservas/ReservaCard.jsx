import Icono from '../ui/Icono';
import { BadgeEstado } from '../ui/Badge';
import {
  formatearHora,
  obtenerDiaMes,
  obtenerMesCorto,
  esFechaPasada,
} from '../../lib/formato';

export default function ReservaCard({ reserva, onCancelar, onEditar }) {
  const cancelada = reserva.estado === 'cancelada';
  const pasada = esFechaPasada(reserva.fecha);
  // Solo tiene sentido cancelar una reserva futura que siga viva.
  const puedeCancelarse = !cancelada && !pasada;
  // Editar los datos solo es posible mientras la reserva siga pendiente.
  const puedeEditarse = reserva.estado === 'pendiente' && !pasada;

  const manejarCancelacion = (event) => {
    event.preventDefault();
    onCancelar(reserva);
  };

  const manejarEdicion = (event) => {
    event.preventDefault();
    onEditar(reserva);
  };

  return (
    <article
      className={`bg-surface-container brutalist-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
        cancelada ? 'opacity-60' : 'hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10'
      }`}
    >
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-surface-variant flex flex-col items-center justify-center rounded-lg shrink-0">
          <span
            className={`text-label-sm font-bold uppercase ${
              cancelada ? 'text-tertiary' : 'text-primary'
            }`}
          >
            {obtenerMesCorto(reserva.fecha)}
          </span>
          <span className="font-headline text-headline-md leading-none text-on-surface">
            {obtenerDiaMes(reserva.fecha)}
          </span>
        </div>

        <div>
          <h3 className="font-bold text-body-lg text-on-surface">Snakko</h3>
          <p className="text-tertiary flex items-center gap-2 text-body-md">
            <Icono nombre="reloj" className="w-4 h-4 shrink-0" />
            {formatearHora(reserva.franja)} •{' '}
            {reserva.personas === 1 ? '1 persona' : `${reserva.personas} personas`}
          </p>
          {reserva.notas ? (
            <p className="text-label-sm text-tertiary/70 mt-1 italic">{reserva.notas}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-6 justify-between md:justify-end">
        <BadgeEstado estado={reserva.estado} />
        {puedeEditarse || puedeCancelarse ? (
          <div className="flex items-center gap-4">
            {puedeEditarse ? (
              <button
                type="button"
                onClick={manejarEdicion}
                className="text-primary font-bold text-label-bold uppercase hover:underline transition-all"
              >
                Editar
              </button>
            ) : null}
            {puedeCancelarse ? (
              <button
                type="button"
                onClick={manejarCancelacion}
                className="text-error font-bold text-label-bold uppercase hover:underline transition-all"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        ) : (
          <span className="text-surface-variant font-bold text-label-bold uppercase">
            Sin acciones
          </span>
        )}
      </div>
    </article>
  );
}
