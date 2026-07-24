import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useTodasLasReservas } from '../../hooks/useReservas';
import Icono from '../../components/ui/Icono';
import Spinner from '../../components/ui/Spinner';
import { BadgeEstado } from '../../components/ui/Badge';
import {
  fechaDeHoyISO,
  formatearHora,
  obtenerIniciales,
  fechaAISO,
  fechaDesdeISO,
} from '../../lib/formato';

const DIAS_GRAFICO = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function TarjetaEstadistica({ titulo, valor, icono, detalle }) {
  return (
    <article className="glass-card p-6 rounded-xl relative overflow-hidden">
      <div className="relative z-10">
        <p className="font-bold text-label-bold text-primary mb-2 uppercase tracking-widest">
          {titulo}
        </p>
        <p className="font-headline text-headline-lg text-on-surface leading-none">
          {valor}
        </p>
        {detalle ? (
          <p className="mt-4 text-label-sm text-tertiary">{detalle}</p>
        ) : null}
      </div>
      <Icono
        nombre={icono}
        className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 text-on-surface rotate-12"
      />
    </article>
  );
}

export default function Dashboard() {
  const { reservas, cargando, recargar } = useTodasLasReservas();
  const toast = useToast();

  const estadisticas = useMemo(() => {
    const hoy = fechaDeHoyISO();
    const activas = reservas.filter((reserva) => reserva.estado !== 'cancelada');

    const deHoy = activas.filter((reserva) => reserva.fecha === hoy);
    const pendientes = reservas.filter((reserva) => reserva.estado === 'pendiente');
    const comensalesHoy = deHoy.reduce((suma, reserva) => suma + reserva.personas, 0);

    // Clientes distintos que han reservado alguna vez.
    const clientesUnicos = new Set(reservas.map((reserva) => reserva.usuario_id));

    // Comensales esperados en los próximos 7 días.
    const inicioSemana = new Date();
    inicioSemana.setHours(0, 0, 0, 0);

    const comensalesPorDia = Array.from({ length: 7 }, (_, indice) => {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + indice);
      const iso = fechaAISO(dia);

      return {
        iso,
        // getDay(): 0 = domingo. Se reordena para empezar en lunes.
        etiqueta: DIAS_GRAFICO[(fechaDesdeISO(iso).getDay() + 6) % 7],
        comensales: activas
          .filter((reserva) => reserva.fecha === iso)
          .reduce((suma, reserva) => suma + reserva.personas, 0),
      };
    });

    // Sin aforo fijo, las barras se escalan respecto al día con más
    // reservas de la semana en lugar de un máximo absoluto.
    const maximoSemana = Math.max(
      ...comensalesPorDia.map((dia) => dia.comensales),
      1
    );

    const ocupacionSemanal = comensalesPorDia.map((dia) => ({
      ...dia,
      porcentaje: Math.round((dia.comensales / maximoSemana) * 100),
    }));

    return {
      reservasHoy: deHoy.length,
      comensalesHoy,
      pendientes: pendientes.length,
      totalClientes: clientesUnicos.size,
      ocupacionSemanal,
      ultimas: [...reservas].slice(0, 6),
    };
  }, [reservas]);

  const cambiarEstado = (reserva, nuevoEstado) => async (event) => {
    event.preventDefault();

    const { error } = await supabase
      .from('reservas')
      .update({ estado: nuevoEstado })
      .eq('id', reserva.id);

    if (error) {
      toast.error('No se pudo actualizar la reserva.');
      return;
    }

    toast.exito(
      nuevoEstado === 'confirmada' ? 'Reserva confirmada.' : 'Reserva cancelada.'
    );
    recargar();
  };

  if (cargando) {
    return <Spinner texto="Cargando el panel…" />;
  }

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
          Resumen del día
        </h1>
        <p className="text-body-lg text-tertiary">
          Bienvenido de nuevo, jefe de parrilla.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <TarjetaEstadistica
          titulo="Reservas hoy"
          valor={estadisticas.reservasHoy}
          icono="calendario"
          detalle={`${estadisticas.comensalesHoy} comensales esperados`}
        />
        <TarjetaEstadistica
          titulo="Pendientes"
          valor={estadisticas.pendientes}
          icono="reloj"
          detalle="A la espera de confirmación"
        />
        <TarjetaEstadistica
          titulo="Clientes"
          valor={estadisticas.totalClientes}
          icono="grupo"
          detalle="Han reservado alguna vez"
        />
        <TarjetaEstadistica
          titulo="Reservas totales"
          valor={reservas.length}
          icono="tendencia"
          detalle="Histórico completo"
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Últimas reservas */}
        <section className="xl:col-span-8 glass-card rounded-xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-8 gap-4">
            <h2 className="font-headline text-headline-md text-on-surface">
              Últimas reservas
            </h2>
            <Link
              to="/admin/reservas"
              className="font-bold text-label-bold text-primary hover:underline uppercase whitespace-nowrap"
            >
              Ver todas
            </Link>
          </div>

          {estadisticas.ultimas.length === 0 ? (
            <p className="text-body-md text-tertiary py-8 text-center">
              Todavía no hay reservas registradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[60rem]">
                <thead>
                  <tr className="border-b border-surface-variant">
                    <th className="pb-4 font-bold text-label-bold text-tertiary uppercase">
                      Cliente
                    </th>
                    <th className="pb-4 font-bold text-label-bold text-tertiary uppercase">
                      Fecha
                    </th>
                    <th className="pb-4 font-bold text-label-bold text-tertiary uppercase">
                      Personas
                    </th>
                    <th className="pb-4 font-bold text-label-bold text-tertiary uppercase">
                      Hora
                    </th>
                    <th className="pb-4 font-bold text-label-bold text-tertiary uppercase">
                      Estado
                    </th>
                    <th className="pb-4 font-bold text-label-bold text-tertiary uppercase text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="text-body-md">
                  {estadisticas.ultimas.map((reserva) => (
                    <tr
                      key={reserva.id}
                      className="border-b border-surface-variant/50 hover:bg-surface-variant/20 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-sm shrink-0">
                            {obtenerIniciales(reserva.nombre_contacto)}
                          </span>
                          <span className="text-on-surface">
                            {reserva.nombre_contacto}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-tertiary">{reserva.fecha}</td>
                      <td className="py-4 text-tertiary">{reserva.personas}</td>
                      <td className="py-4 text-tertiary">
                        {formatearHora(reserva.franja)}
                      </td>
                      <td className="py-4">
                        <BadgeEstado estado={reserva.estado} />
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {reserva.estado !== 'confirmada' &&
                          reserva.estado !== 'cancelada' ? (
                            <button
                              type="button"
                              onClick={cambiarEstado(reserva, 'confirmada')}
                              className="p-2 text-success hover:bg-success/20 rounded-lg transition-colors"
                              aria-label={`Confirmar reserva de ${reserva.nombre_contacto}`}
                            >
                              <Icono nombre="checkCirculo" className="w-5 h-5" />
                            </button>
                          ) : null}
                          {reserva.estado !== 'cancelada' ? (
                            <button
                              type="button"
                              onClick={cambiarEstado(reserva, 'cancelada')}
                              className="p-2 text-error hover:bg-error/20 rounded-lg transition-colors"
                              aria-label={`Cancelar reserva de ${reserva.nombre_contacto}`}
                            >
                              <Icono nombre="cancelar" className="w-5 h-5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Ocupación semanal */}
        <section className="xl:col-span-4 glass-card rounded-xl p-6 md:p-8 flex flex-col">
          <h2 className="font-headline text-headline-md text-on-surface mb-8">
            Próximos 7 días
          </h2>

          <div className="flex-grow flex items-end justify-between gap-2 h-48 mb-6">
            {estadisticas.ocupacionSemanal.map((dia, indice) => (
              <div key={dia.iso} className="flex flex-col items-center flex-1 h-full justify-end">
                <span className="text-label-sm text-tertiary mb-1">
                  {dia.comensales}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    indice === 0 ? 'bg-primary-container' : 'bg-surface-variant'
                  }`}
                  // La altura mínima mantiene la barra visible aunque esté a cero.
                  style={{ height: `${Math.max(dia.porcentaje, 3)}%` }}
                  title={`${dia.comensales} comensales`}
                />
                <span
                  className={`text-label-sm mt-2 ${
                    indice === 0 ? 'text-primary font-bold' : 'text-tertiary'
                  }`}
                >
                  {dia.etiqueta}
                </span>
              </div>
            ))}
          </div>

          <p className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-body-md text-on-surface">
            Comensales esperados por día. Las reservas no tienen límite de
            aforo.
          </p>
        </section>
      </div>
    </div>
  );
}
