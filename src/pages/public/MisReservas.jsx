import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useMisReservas, useDisponibilidad } from '../../hooks/useReservas';
import ReservaCard from '../../components/reservas/ReservaCard';
import Calendario from '../../components/reservas/Calendario';
import SelectorFranja from '../../components/reservas/SelectorFranja';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  esFechaPasada,
  franjaTieneAntelacionSuficiente,
} from '../../lib/formato';

export default function MisReservas() {
  const { usuario } = useAuth();
  const toast = useToast();
  const { reservas, cargando, recargar } = useMisReservas(usuario?.id);

  const [pestanya, setPestanya] = useState('proximas');
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);

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
              onEditar={setReservaEditando}
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

      {reservaEditando ? (
        <ModalEditarMiReserva
          reserva={reservaEditando}
          onCerrar={() => setReservaEditando(null)}
          onGuardado={() => {
            setReservaEditando(null);
            recargar();
          }}
        />
      ) : null}
    </div>
  );
}

const OPCIONES_PERSONAS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Formulario de edición para el propio cliente. Solo alcanza reservas
 * en estado 'pendiente' (ReservaCard ya filtra cuándo se puede abrir).
 * El servidor vuelve a validar antelación, aforo y el estado pendiente.
 */
function ModalEditarMiReserva({ reserva, onCerrar, onGuardado }) {
  const toast = useToast();
  const [fecha, setFecha] = useState(reserva.fecha);
  const [franja, setFranja] = useState(reserva.franja);
  const [personas, setPersonas] = useState(reserva.personas);
  const [nombre, setNombre] = useState(reserva.nombre_contacto);
  const [telefono, setTelefono] = useState(reserva.telefono_contacto ?? '');
  const [notas, setNotas] = useState(reserva.notas ?? '');
  const [guardando, setGuardando] = useState(false);

  const { franjas, cargando: cargandoFranjas } = useDisponibilidad(fecha);

  const seleccionarFecha = (nuevaFecha) => {
    setFecha(nuevaFecha);
    // La franja elegida puede dejar de ser válida al cambiar de fecha.
    setFranja('');
  };

  const seleccionarPersonas = (numero) => (event) => {
    event.preventDefault();
    setPersonas(numero);
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!fecha) {
      toast.error('Selecciona una fecha para tu reserva.');
      return;
    }
    if (!franja) {
      toast.error('Selecciona una franja horaria.');
      return;
    }
    if (!franjaTieneAntelacionSuficiente(fecha, franja)) {
      toast.error('Las reservas requieren al menos 45 minutos de antelación. Elige una hora más tarde.');
      return;
    }
    if (!nombre.trim()) {
      toast.error('Indica el nombre de contacto.');
      return;
    }
    if (!telefono.trim()) {
      toast.error('Indica un teléfono de contacto.');
      return;
    }

    setGuardando(true);
    const { error } = await supabase
      .from('reservas')
      .update({
        fecha,
        franja,
        personas,
        nombre_contacto: nombre.trim(),
        telefono_contacto: telefono.trim(),
        notas: notas.trim(),
      })
      .eq('id', reserva.id);
    setGuardando(false);

    if (error) {
      const mensaje =
        error.message.includes('No se puede reservar')
        || error.message.includes('franja horaria')
        || error.message.includes('antelación')
        || error.message.includes('Aforo completo')
        || error.message.includes('ya no se puede modificar')
          ? error.message
          : 'No se pudieron guardar los cambios. Inténtalo de nuevo.';
      toast.error(mensaje);
      return;
    }

    toast.exito('Reserva actualizada correctamente.');
    onGuardado();
  };

  return (
    <Modal abierto titulo="Editar reserva" onCerrar={onCerrar} ancho="max-w-3xl">
      <form onSubmit={manejarEnvio} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Calendario fechaSeleccionada={fecha} onSeleccionar={seleccionarFecha} />

          <div className="space-y-6">
            <span className="etiqueta-formulario">Número de personas</span>
            <div className="grid grid-cols-4 gap-3">
              {OPCIONES_PERSONAS.map((numero) => (
                <button
                  key={numero}
                  type="button"
                  onClick={seleccionarPersonas(numero)}
                  aria-pressed={personas === numero}
                  className={
                    personas === numero
                      ? 'py-4 bg-surface border border-primary text-primary font-bold rounded-xl shadow-md shadow-primary/20 transition-all'
                      : 'py-4 bg-surface border border-on-surface/15 hover:border-primary hover:text-primary rounded-xl transition-all'
                  }
                >
                  {numero}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <span className="etiqueta-formulario">Franja horaria</span>
          <p className="text-body-md text-tertiary mb-4">
            Las reservas deben realizarse con 45 minutos de anticipación.
          </p>
          <SelectorFranja
            franjas={franjas}
            fecha={fecha}
            cargando={cargandoFranjas}
            franjaSeleccionada={franja}
            onSeleccionar={setFranja}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="editar-mi-nombre" className="etiqueta-formulario">
              Nombre de contacto
            </label>
            <input
              id="editar-mi-nombre"
              type="text"
              className="campo-formulario"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="editar-mi-telefono" className="etiqueta-formulario">
              Teléfono
            </label>
            <input
              id="editar-mi-telefono"
              type="tel"
              className="campo-formulario"
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="editar-mi-notas" className="etiqueta-formulario">
            Notas
          </label>
          <textarea
            id="editar-mi-notas"
            rows={3}
            className="campo-formulario resize-none"
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            placeholder="Alergias, trona para bebé, celebración…"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
          <button type="button" onClick={onCerrar} className="btn-secundario">
            Cancelar
          </button>
          <button type="submit" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
