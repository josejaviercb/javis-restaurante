import Icono from '../ui/Icono';
import Spinner from '../ui/Spinner';
import {
  formatearHora,
  franjaTieneAntelacionSuficiente,
  ANTELACION_MINIMA_MINUTOS,
} from '../../lib/formato';

/**
 * Selector de franja horaria. Muestra todas las horas disponibles de
 * forma continua (sin agrupar por turno). Las franjas que no cumplen la
 * antelación mínima (45 min) para hoy aparecen desactivadas.
 */
export default function SelectorFranja({
  franjas,
  fecha,
  cargando,
  franjaSeleccionada,
  onSeleccionar,
}) {
  if (cargando) {
    return <Spinner texto="Comprobando disponibilidad…" />;
  }

  if (franjas.length === 0) {
    return (
      <p className="text-body-md text-tertiary">
        Selecciona primero una fecha para ver las horas disponibles.
      </p>
    );
  }

  // Cada franja se marca como habilitada o no según la antelación mínima.
  const franjasConEstado = franjas.map((franja) => ({
    ...franja,
    habilitada: franjaTieneAntelacionSuficiente(fecha, franja.hora),
  }));

  const hayAlgunaDisponible = franjasConEstado.some((franja) => franja.habilitada);

  // Con una fecha elegida pero sin ninguna franja disponible, el motivo
  // solo puede ser la antelación mínima (la fecha ya pasó o es demasiado tarde).
  if (fecha && !hayAlgunaDisponible) {
    return (
      <div className="flex items-start gap-3 p-4 bg-surface border-l-4 border-primary rounded-r-xl">
        <Icono nombre="aviso" className="w-6 h-6 text-primary shrink-0" />
        <p className="text-body-md text-tertiary">
          No quedan horarios disponibles para hoy con {ANTELACION_MINIMA_MINUTOS}{' '}
          minutos de antelación. Prueba a elegir otra fecha.
        </p>
      </div>
    );
  }

  const seleccionar = (hora) => (event) => {
    event.preventDefault();
    onSeleccionar(hora);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {franjasConEstado.map((franja) => {
        const hora = formatearHora(franja.hora);
        const seleccionada = franja.hora === franjaSeleccionada;

        if (!franja.habilitada) {
          return (
            <button
              key={franja.hora}
              type="button"
              disabled
              aria-disabled="true"
              title="No disponible: se requieren 45 minutos de antelación"
              className="px-6 py-3 bg-surface border border-on-surface/10 rounded-xl font-bold text-label-bold text-on-surface/25 line-through cursor-not-allowed"
            >
              {hora}
            </button>
          );
        }

        return (
          <button
            key={franja.hora}
            type="button"
            onClick={seleccionar(franja.hora)}
            aria-pressed={seleccionada}
            className={
              seleccionada
                ? 'px-6 py-3 bg-primary text-on-primary border border-primary rounded-xl shadow-md shadow-primary/20 font-bold text-label-bold transition-all'
                : 'px-6 py-3 bg-surface border border-on-surface/15 hover:border-primary hover:text-primary rounded-xl font-bold text-label-bold transition-all'
            }
          >
            {hora}
          </button>
        );
      })}
    </div>
  );
}
