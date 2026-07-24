import { useMemo, useState } from 'react';
import Icono from '../ui/Icono';
import { DIAS_SEMANA_CORTOS, fechaAISO, nombreMesAnyo } from '../../lib/formato';

/**
 * Calendario mensual propio, sin dependencias externas.
 * Las fechas anteriores a hoy quedan deshabilitadas.
 */
export default function Calendario({ fechaSeleccionada, onSeleccionar }) {
  const hoy = useMemo(() => {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  }, []);

  const [mesVisible, setMesVisible] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );

  const celdas = useMemo(() => {
    const anyo = mesVisible.getFullYear();
    const mes = mesVisible.getMonth();
    const primerDia = new Date(anyo, mes, 1);
    const diasEnMes = new Date(anyo, mes + 1, 0).getDate();

    // getDay() devuelve 0 para domingo; aquí la semana empieza en lunes.
    const desplazamiento = (primerDia.getDay() + 6) % 7;

    const resultado = [];
    for (let i = 0; i < desplazamiento; i += 1) {
      resultado.push(null);
    }
    for (let dia = 1; dia <= diasEnMes; dia += 1) {
      resultado.push(new Date(anyo, mes, dia));
    }
    return resultado;
  }, [mesVisible]);

  // No se permite retroceder por debajo del mes actual.
  const puedeRetroceder =
    mesVisible.getFullYear() > hoy.getFullYear() ||
    (mesVisible.getFullYear() === hoy.getFullYear() &&
      mesVisible.getMonth() > hoy.getMonth());

  const cambiarMes = (incremento) => (event) => {
    event.preventDefault();
    setMesVisible(
      (actual) => new Date(actual.getFullYear(), actual.getMonth() + incremento, 1)
    );
  };

  const seleccionarDia = (fecha) => (event) => {
    event.preventDefault();
    onSeleccionar(fechaAISO(fecha));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-on-surface">
        <span className="font-bold text-label-bold uppercase tracking-wider">
          {nombreMesAnyo(mesVisible)}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cambiarMes(-1)}
            disabled={!puedeRetroceder}
            className="p-1 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Mes anterior"
          >
            <Icono nombre="flechaIzquierda" className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={cambiarMes(1)}
            className="p-1 hover:text-primary transition-colors"
            aria-label="Mes siguiente"
          >
            <Icono nombre="flechaDerecha" className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-label-sm text-tertiary">
        {DIAS_SEMANA_CORTOS.map((dia) => (
          <div key={dia}>{dia}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {celdas.map((fecha, indice) => {
          if (!fecha) {
            // Hueco antes del primer día del mes.
            return <div key={`vacio-${indice}`} aria-hidden="true" />;
          }

          const iso = fechaAISO(fecha);
          const esPasada = fecha < hoy;
          const estaSeleccionada = iso === fechaSeleccionada;

          if (esPasada) {
            return (
              <div
                key={iso}
                className="p-3 rounded-lg border border-transparent flex items-center justify-center text-tertiary/40 cursor-not-allowed text-body-md"
              >
                {fecha.getDate()}
              </div>
            );
          }

          return (
            <button
              key={iso}
              type="button"
              onClick={seleccionarDia(fecha)}
              aria-pressed={estaSeleccionada}
              className={
                estaSeleccionada
                  ? 'p-3 rounded-lg border border-primary-container flex items-center justify-center font-bold bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(255,87,26,0.3)] transition-all'
                  : 'p-3 rounded-lg border border-surface-variant flex items-center justify-center bg-surface hover:border-primary hover:text-primary transition-all'
              }
            >
              {fecha.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
