import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useTodasLasReservas } from '../../hooks/useReservas';
import { useDisponibilidad } from '../../hooks/useReservas';
import Icono from '../../components/ui/Icono';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { BadgeEstado } from '../../components/ui/Badge';
import { formatearHora, obtenerIniciales } from '../../lib/formato';

const ESTADOS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'confirmada', texto: 'Confirmadas' },
  { valor: 'cancelada', texto: 'Canceladas' },
];

export default function AdminReservas() {
  const { reservas, cargando, recargar } = useTodasLasReservas();
  const toast = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [reservaEditando, setReservaEditando] = useState(null);
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const reservasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return reservas.filter((reserva) => {
      const coincideEstado = estado === 'todos' || reserva.estado === estado;
      const coincideFecha = !fechaFiltro || reserva.fecha === fechaFiltro;
      const coincideBusqueda =
        !termino ||
        reserva.nombre_contacto.toLowerCase().includes(termino) ||
        (reserva.telefono_contacto ?? '').toLowerCase().includes(termino);

      return coincideEstado && coincideFecha && coincideBusqueda;
    });
  }, [reservas, busqueda, estado, fechaFiltro]);

  const cambiarEstado = async (reserva, nuevoEstado) => {
    const { error } = await supabase
      .from('reservas')
      .update({ estado: nuevoEstado })
      .eq('id', reserva.id);

    if (error) {
      toast.error('No se pudo actualizar el estado de la reserva.');
      return false;
    }
    recargar();
    return true;
  };

  const confirmarReserva = (reserva) => async (event) => {
    event.preventDefault();
    const ok = await cambiarEstado(reserva, 'confirmada');
    if (ok) toast.exito('Reserva confirmada.');
  };

  const confirmarCancelacion = async () => {
    setGuardando(true);
    const ok = await cambiarEstado(reservaACancelar, 'cancelada');
    setGuardando(false);
    setReservaACancelar(null);
    if (ok) toast.exito('Reserva cancelada.');
  };

  const limpiarFiltros = (event) => {
    event.preventDefault();
    setBusqueda('');
    setEstado('todos');
    setFechaFiltro('');
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
          Gestión de reservas
        </h1>
        <p className="text-body-lg text-tertiary">
          Busca, filtra, modifica y cancela las reservas del restaurante.
        </p>
      </header>

      {/* Filtros */}
      <section className="bg-surface-container-low brutalist-border rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          <div className="xl:col-span-2">
            <label htmlFor="busqueda" className="etiqueta-formulario">
              Buscar por nombre o teléfono
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none">
                <Icono nombre="buscar" className="w-5 h-5" />
              </span>
              <input
                id="busqueda"
                type="search"
                className="campo-formulario pl-12"
                placeholder="Ricardo Moreno…"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="estado" className="etiqueta-formulario">
              Estado
            </label>
            <select
              id="estado"
              className="campo-formulario"
              value={estado}
              onChange={(event) => setEstado(event.target.value)}
            >
              {ESTADOS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha-filtro" className="etiqueta-formulario">
              Fecha
            </label>
            <input
              id="fecha-filtro"
              type="date"
              className="campo-formulario"
              value={fechaFiltro}
              onChange={(event) => setFechaFiltro(event.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-variant gap-4 flex-wrap">
          <p className="text-label-sm text-tertiary">
            {reservasFiltradas.length} de {reservas.length} reservas
          </p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-label-bold font-bold text-primary hover:underline uppercase"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      {cargando ? <Spinner texto="Cargando reservas…" /> : null}

      {!cargando && reservasFiltradas.length === 0 ? (
        <EmptyState
          icono="calendario"
          titulo="Sin resultados"
          mensaje="No hay reservas que coincidan con los filtros seleccionados."
        />
      ) : null}

      {!cargando && reservasFiltradas.length > 0 ? (
        <section className="bg-surface-container-low brutalist-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[80rem]">
              <thead className="bg-surface-container-highest/50 border-b-2 border-surface-variant">
                <tr>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Personas
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {reservasFiltradas.map((reserva) => (
                  <tr
                    key={reserva.id}
                    className="hover:bg-surface-container/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-sm shrink-0">
                          {obtenerIniciales(reserva.nombre_contacto)}
                        </span>
                        <div>
                          <p className="font-bold text-on-surface">
                            {reserva.nombre_contacto}
                          </p>
                          <p className="text-label-sm text-tertiary">
                            {reserva.telefono_contacto || 'Sin teléfono'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-tertiary">{reserva.fecha}</td>
                    <td className="px-6 py-4 text-tertiary">
                      {formatearHora(reserva.franja)}
                    </td>
                    <td className="px-6 py-4 text-tertiary">{reserva.personas}</td>
                    <td className="px-6 py-4">
                      <BadgeEstado estado={reserva.estado} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {reserva.estado === 'pendiente' ? (
                          <button
                            type="button"
                            onClick={confirmarReserva(reserva)}
                            className="p-2 text-success hover:bg-success/20 rounded-lg transition-colors"
                            title="Confirmar"
                            aria-label={`Confirmar reserva de ${reserva.nombre_contacto}`}
                          >
                            <Icono nombre="checkCirculo" className="w-5 h-5" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            setReservaEditando(reserva);
                          }}
                          className="p-2 text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar"
                          aria-label={`Editar reserva de ${reserva.nombre_contacto}`}
                        >
                          <Icono nombre="editar" className="w-5 h-5" />
                        </button>
                        {reserva.estado !== 'cancelada' ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              setReservaACancelar(reserva);
                            }}
                            className="p-2 text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Cancelar"
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
        </section>
      ) : null}

      {reservaEditando ? (
        <ModalEditarReserva
          reserva={reservaEditando}
          onCerrar={() => setReservaEditando(null)}
          onGuardado={() => {
            setReservaEditando(null);
            recargar();
          }}
        />
      ) : null}

      <ConfirmDialog
        abierto={Boolean(reservaACancelar)}
        titulo="Cancelar reserva"
        mensaje={`¿Seguro que quieres cancelar la reserva de ${reservaACancelar?.nombre_contacto}?`}
        textoConfirmar="Sí, cancelar"
        textoCancelar="Volver"
        peligroso
        cargando={guardando}
        onConfirmar={confirmarCancelacion}
        onCancelar={() => setReservaACancelar(null)}
      />
    </div>
  );
}

/**
 * Formulario de edición de una reserva existente.
 * El servidor sigue validando la fecha y la franja horaria.
 */
function ModalEditarReserva({ reserva, onCerrar, onGuardado }) {
  const toast = useToast();
  const [datos, setDatos] = useState({
    fecha: reserva.fecha,
    franja: reserva.franja,
    personas: reserva.personas,
    nombre_contacto: reserva.nombre_contacto,
    telefono_contacto: reserva.telefono_contacto ?? '',
    estado: reserva.estado,
    notas: reserva.notas ?? '',
  });
  const [guardando, setGuardando] = useState(false);

  const { franjas } = useDisponibilidad(datos.fecha);

  const actualizar = (campo) => (event) => {
    const valor =
      campo === 'personas' ? Number(event.target.value) : event.target.value;
    setDatos((previos) => ({ ...previos, [campo]: valor }));
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setGuardando(true);

    const { error } = await supabase
      .from('reservas')
      .update({
        fecha: datos.fecha,
        franja: datos.franja,
        personas: datos.personas,
        nombre_contacto: datos.nombre_contacto.trim(),
        telefono_contacto: datos.telefono_contacto.trim(),
        estado: datos.estado,
        notas: datos.notas.trim(),
      })
      .eq('id', reserva.id);

    setGuardando(false);

    if (error) {
      const mensaje =
        error.message.includes('No se puede reservar') ||
        error.message.includes('franja horaria')
          ? error.message
          : 'No se pudieron guardar los cambios.';
      toast.error(mensaje);
      return;
    }

    toast.exito('Reserva actualizada.');
    onGuardado();
  };

  return (
    <Modal abierto titulo="Editar reserva" onCerrar={onCerrar}>
      <form onSubmit={manejarEnvio} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="editar-fecha" className="etiqueta-formulario">
              Fecha
            </label>
            <input
              id="editar-fecha"
              type="date"
              className="campo-formulario"
              value={datos.fecha}
              onChange={actualizar('fecha')}
              required
            />
          </div>

          <div>
            <label htmlFor="editar-franja" className="etiqueta-formulario">
              Franja horaria
            </label>
            <select
              id="editar-franja"
              className="campo-formulario"
              value={datos.franja}
              onChange={actualizar('franja')}
              required
            >
              {/* La franja actual se mantiene aunque esté llena. */}
              <option value={reserva.franja}>
                {formatearHora(reserva.franja)} (actual)
              </option>
              {franjas
                .filter((franja) => franja.hora !== reserva.franja)
                .map((franja) => (
                  <option key={franja.hora} value={franja.hora}>
                    {formatearHora(franja.hora)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="editar-personas" className="etiqueta-formulario">
              Personas
            </label>
            <input
              id="editar-personas"
              type="number"
              min={1}
              max={8}
              className="campo-formulario"
              value={datos.personas}
              onChange={actualizar('personas')}
              required
            />
          </div>

          <div>
            <label htmlFor="editar-estado" className="etiqueta-formulario">
              Estado
            </label>
            <select
              id="editar-estado"
              className="campo-formulario"
              value={datos.estado}
              onChange={actualizar('estado')}
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label htmlFor="editar-nombre" className="etiqueta-formulario">
              Nombre de contacto
            </label>
            <input
              id="editar-nombre"
              type="text"
              className="campo-formulario"
              value={datos.nombre_contacto}
              onChange={actualizar('nombre_contacto')}
              required
            />
          </div>

          <div>
            <label htmlFor="editar-telefono" className="etiqueta-formulario">
              Teléfono
            </label>
            <input
              id="editar-telefono"
              type="tel"
              className="campo-formulario"
              value={datos.telefono_contacto}
              onChange={actualizar('telefono_contacto')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="editar-notas" className="etiqueta-formulario">
            Notas
          </label>
          <textarea
            id="editar-notas"
            rows={3}
            className="campo-formulario resize-none"
            value={datos.notas}
            onChange={actualizar('notas')}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onCerrar();
            }}
            className="btn-secundario"
          >
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
