import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Icono from '../../components/ui/Icono';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { obtenerIniciales } from '../../lib/formato';

export default function AdminClientes() {
  const { usuario } = useAuth();
  const toast = useToast();

  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [rolFiltro, setRolFiltro] = useState('todos');
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('No se pudieron cargar los clientes:', error.message);
      setClientes([]);
    } else {
      setClientes(data ?? []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return clientes.filter((cliente) => {
      const coincideRol = rolFiltro === 'todos' || cliente.rol === rolFiltro;
      const coincideBusqueda =
        !termino ||
        (cliente.nombre ?? '').toLowerCase().includes(termino) ||
        (cliente.telefono ?? '').toLowerCase().includes(termino);
      return coincideRol && coincideBusqueda;
    });
  }, [clientes, busqueda, rolFiltro]);

  const confirmarEliminacion = async () => {
    setEliminando(true);
    const { error } = await supabase
      .from('perfiles')
      .delete()
      .eq('id', clienteAEliminar.id);

    setEliminando(false);
    setClienteAEliminar(null);

    if (error) {
      toast.error('No se pudo eliminar el cliente.');
      return;
    }

    toast.exito('Cliente eliminado. Sus reservas también se han borrado.');
    cargar();
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
          Gestión de clientes
        </h1>
        <p className="text-body-lg text-tertiary">
          Consulta y administra las personas registradas en la web.
        </p>
      </header>

      <section className="bg-surface-container-low brutalist-border rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="buscar-cliente" className="etiqueta-formulario">
              Buscar por nombre o teléfono
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none">
                <Icono nombre="buscar" className="w-5 h-5" />
              </span>
              <input
                id="buscar-cliente"
                type="search"
                className="campo-formulario pl-12"
                placeholder="Sofía García…"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="filtro-rol" className="etiqueta-formulario">
              Rol
            </label>
            <select
              id="filtro-rol"
              className="campo-formulario"
              value={rolFiltro}
              onChange={(event) => setRolFiltro(event.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="cliente">Clientes</option>
              <option value="administrador">Administradores</option>
            </select>
          </div>
        </div>

        <p className="text-label-sm text-tertiary mt-4 pt-4 border-t border-surface-variant">
          {clientesFiltrados.length} de {clientes.length} personas registradas
        </p>
      </section>

      {cargando ? <Spinner texto="Cargando clientes…" /> : null}

      {!cargando && clientesFiltrados.length === 0 ? (
        <EmptyState
          icono="grupo"
          titulo="Sin clientes"
          mensaje="No hay personas registradas que coincidan con la búsqueda."
        />
      ) : null}

      {!cargando && clientesFiltrados.length > 0 ? (
        <section className="bg-surface-container-low brutalist-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[60rem]">
              <thead className="bg-surface-container-highest/50 border-b-2 border-surface-variant">
                <tr>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {clientesFiltrados.map((cliente) => {
                  const esUsuarioActual = cliente.id === usuario?.id;

                  return (
                    <tr
                      key={cliente.id}
                      className="hover:bg-surface-container/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold shrink-0">
                            {obtenerIniciales(cliente.nombre)}
                          </span>
                          <div>
                            <p className="font-bold text-on-surface">
                              {cliente.nombre || 'Sin nombre'}
                              {esUsuarioActual ? (
                                <span className="text-label-sm text-primary ml-2">
                                  (tú)
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-tertiary">
                        {cliente.telefono || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variante={
                            cliente.rol === 'administrador' ? 'destacado' : 'neutro'
                          }
                        >
                          {cliente.rol === 'administrador'
                            ? 'Administrador'
                            : 'Cliente'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              setClienteEditando(cliente);
                            }}
                            className="p-2 text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            aria-label={`Editar ${cliente.nombre}`}
                          >
                            <Icono nombre="editar" className="w-5 h-5" />
                          </button>
                          {/* Evita que un administrador se borre a sí mismo. */}
                          {!esUsuarioActual ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                setClienteAEliminar(cliente);
                              }}
                              className="p-2 text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                              aria-label={`Eliminar ${cliente.nombre}`}
                            >
                              <Icono nombre="eliminar" className="w-5 h-5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {clienteEditando ? (
        <ModalCliente
          cliente={clienteEditando}
          esUsuarioActual={clienteEditando.id === usuario?.id}
          onCerrar={() => setClienteEditando(null)}
          onGuardado={() => {
            setClienteEditando(null);
            cargar();
          }}
        />
      ) : null}

      <ConfirmDialog
        abierto={Boolean(clienteAEliminar)}
        titulo="Eliminar cliente"
        mensaje={`¿Seguro que quieres eliminar a "${clienteAEliminar?.nombre || 'este cliente'}"? Se borrarán también todas sus reservas.`}
        textoConfirmar="Sí, eliminar"
        peligroso
        cargando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setClienteAEliminar(null)}
      />
    </div>
  );
}

function ModalCliente({ cliente, esUsuarioActual, onCerrar, onGuardado }) {
  const toast = useToast();
  const [datos, setDatos] = useState({
    nombre: cliente.nombre ?? '',
    telefono: cliente.telefono ?? '',
    rol: cliente.rol,
  });
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo) => (event) => {
    setDatos((previos) => ({ ...previos, [campo]: event.target.value }));
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!datos.nombre.trim()) {
      toast.error('El cliente necesita un nombre.');
      return;
    }

    setGuardando(true);
    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        rol: datos.rol,
      })
      .eq('id', cliente.id);

    setGuardando(false);

    if (error) {
      toast.error('No se pudieron guardar los cambios.');
      return;
    }

    toast.exito('Cliente actualizado.');
    onGuardado();
  };

  return (
    <Modal abierto titulo="Editar cliente" onCerrar={onCerrar} ancho="max-w-xl">
      <form onSubmit={manejarEnvio} className="space-y-5">
        <div>
          <label htmlFor="cliente-nombre" className="etiqueta-formulario">
            Nombre completo
          </label>
          <input
            id="cliente-nombre"
            type="text"
            className="campo-formulario"
            value={datos.nombre}
            onChange={actualizar('nombre')}
            required
          />
        </div>

        <div>
          <label htmlFor="cliente-telefono" className="etiqueta-formulario">
            Teléfono
          </label>
          <input
            id="cliente-telefono"
            type="tel"
            className="campo-formulario"
            value={datos.telefono}
            onChange={actualizar('telefono')}
            placeholder="+593 991234567"
          />
        </div>

        <div>
          <label htmlFor="cliente-rol" className="etiqueta-formulario">
            Rol
          </label>
          <select
            id="cliente-rol"
            className="campo-formulario"
            value={datos.rol}
            onChange={actualizar('rol')}
            disabled={esUsuarioActual}
          >
            <option value="cliente">Cliente</option>
            <option value="administrador">Administrador</option>
          </select>
          {esUsuarioActual ? (
            <p className="text-label-sm text-tertiary mt-2">
              No puedes cambiar tu propio rol para no perder el acceso al panel.
            </p>
          ) : null}
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
