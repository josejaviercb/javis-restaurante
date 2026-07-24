import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useMisReservas } from '../../hooks/useReservas';
import ReservaCard from '../../components/reservas/ReservaCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { esFechaPasada } from '../../lib/formato';

export default function MisReservas() {
  const { usuario } = useAuth();
  const toast = useToast();
  const { reservas, cargando, recargar } = useMisReservas(usuario?.id);

  const [pestanya, setPestanya] = useState('proximas');
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const { proximas, pasadas } = useMemo(() => {
    const listaProximas = [];
    const listaPasadas = [];

    reservas.forEach((reserva) => {
      // Las canceladas se archivan junto con el historial.
      if (esFechaPasada(reserva.fecha) || reserva.estado === 'cancelada') {
        listaPasadas.push(reserva);
      } else {
        listaProximas.push(reserva);
      }
    });

    // Las próximas se muestran de la más cercana a la más lejana.
    listaProximas.sort((a, b) =>
      `${a.fecha}${a.franja}`.localeCompare(`${b.fecha}${b.franja}`)
    );

    return { proximas: listaProximas, pasadas: listaPasadas };
  }, [reservas]);

  const listaVisible = pestanya === 'proximas' ? proximas : pasadas;

  const cambiarPestanya = (valor) => (event) => {
    event.preventDefault();
    setPestanya(valor);
  };

  const confirmarCancelacion = async () => {
    if (!reservaACancelar) return;

    setCancelando(true);
    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', reservaACancelar.id);
    setCancelando(false);
    setReservaACancelar(null);

    if (error) {
      toast.error('No se pudo cancelar la reserva. Inténtalo de nuevo.');
      return;
    }

    toast.exito('Reserva cancelada correctamente.');
    recargar();
  };

  const claseTab = (activa) =>
    activa
      ? 'font-bold text-label-bold text-primary border-b-2 border-primary px-2 pb-1 uppercase'
      : 'font-bold text-label-bold text-tertiary hover:text-on-surface transition-colors px-2 pb-1 uppercase';

  return (
    <div className="px-margin-mobile md:px-margin-desktop pb-24 max-w-container-max mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pt-8">
        <div>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
            Mis reservas
          </h1>
          <p className="text-body-lg text-tertiary">
            Gestiona tus próximas visitas y revisa tu historial.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={cambiarPestanya('proximas')}
            className={claseTab(pestanya === 'proximas')}
          >
            Próximas ({proximas.length})
          </button>
          <button
            type="button"
            onClick={cambiarPestanya('pasadas')}
            className={claseTab(pestanya === 'pasadas')}
          >
            Pasadas ({pasadas.length})
          </button>
        </div>
      </header>

      {cargando ? <Spinner texto="Cargando tus reservas…" /> : null}

      {!cargando && listaVisible.length === 0 ? (
        <EmptyState
          icono="calendario"
          titulo={
            pestanya === 'proximas' ? 'No tienes reservas próximas' : 'Sin historial'
          }
          mensaje={
            pestanya === 'proximas'
              ? 'Reserva tu mesa y disfruta de la mejor comida de la ciudad.'
              : 'Aquí aparecerán tus reservas pasadas y canceladas.'
          }
        >
          {pestanya === 'proximas' ? (
            <Link to="/reservas" className="btn-primario">
              Reservar mesa
            </Link>
          ) : null}
        </EmptyState>
      ) : null}

      {!cargando && listaVisible.length > 0 ? (
        <div className="space-y-4">
          {listaVisible.map((reserva) => (
            <ReservaCard
              key={reserva.id}
              reserva={reserva}
              onCancelar={setReservaACancelar}
            />
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        abierto={Boolean(reservaACancelar)}
        titulo="Cancelar reserva"
        mensaje="¿Seguro que quieres cancelar esta reserva? Esta acción no se puede deshacer."
        textoConfirmar="Sí, cancelar"
        textoCancelar="Volver"
        peligroso
        cargando={cancelando}
        onConfirmar={confirmarCancelacion}
        onCancelar={() => setReservaACancelar(null)}
      />
    </div>
  );
}
