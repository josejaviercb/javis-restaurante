import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { usePlatos, useSecciones } from '../../hooks/usePlatos';
import Icono from '../../components/ui/Icono';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { formatearPrecio } from '../../lib/formato';

const ETIQUETAS = ['', 'Popular', 'Best Seller', 'Picante', 'Vegano'];
const TAMANYO_MAXIMO_MB = 5;

export default function AdminCarta() {
  // En el panel se ven también los platos no disponibles.
  const { platos, cargando, recargar } = usePlatos({ soloDisponibles: false });
  const { secciones } = useSecciones({ soloActivas: false });
  const toast = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [seccionFiltro, setSeccionFiltro] = useState('todas');
  const [platoEditando, setPlatoEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [platoAEliminar, setPlatoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const platosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return platos.filter((plato) => {
      const coincideSeccion =
        seccionFiltro === 'todas' || plato.seccion_id === seccionFiltro;
      const coincideBusqueda =
        !termino || plato.nombre.toLowerCase().includes(termino);
      return coincideSeccion && coincideBusqueda;
    });
  }, [platos, busqueda, seccionFiltro]);

  const confirmarEliminacion = async () => {
    setEliminando(true);

    // Si la imagen está en nuestro bucket, se borra también el fichero.
    const url = platoAEliminar.imagen_url ?? '';
    const marcador = '/storage/v1/object/public/platos/';
    if (url.includes(marcador)) {
      const ruta = url.split(marcador)[1];
      if (ruta) await supabase.storage.from('platos').remove([ruta]);
    }

    const { error } = await supabase
      .from('platos')
      .delete()
      .eq('id', platoAEliminar.id);

    setEliminando(false);
    setPlatoAEliminar(null);

    if (error) {
      toast.error('No se pudo eliminar el plato.');
      return;
    }

    toast.exito('Plato eliminado.');
    recargar();
  };

  const alternarDisponibilidad = (plato) => async (event) => {
    event.preventDefault();
    const { error } = await supabase
      .from('platos')
      .update({ disponible: !plato.disponible })
      .eq('id', plato.id);

    if (error) {
      toast.error('No se pudo cambiar la disponibilidad.');
      return;
    }
    recargar();
  };

  return (
    <div>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
            Gestión de la carta
          </h1>
          <p className="text-body-lg text-tertiary">
            Personaliza los ingredientes del éxito de Snakko.
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            setCreando(true);
          }}
          className="btn-primario flex items-center gap-2 whitespace-nowrap"
        >
          <Icono nombre="añadirCirculo" className="w-5 h-5" />
          Añadir plato
        </button>
      </header>

      <section className="bg-surface-container-low brutalist-border rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="buscar-plato" className="etiqueta-formulario">
              Buscar plato
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none">
                <Icono nombre="buscar" className="w-5 h-5" />
              </span>
              <input
                id="buscar-plato"
                type="search"
                className="campo-formulario pl-12"
                placeholder="Broster Clásico…"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="filtro-seccion" className="etiqueta-formulario">
              Sección
            </label>
            <select
              id="filtro-seccion"
              className="campo-formulario"
              value={seccionFiltro}
              onChange={(event) => setSeccionFiltro(event.target.value)}
            >
              <option value="todas">Todas</option>
              {secciones.map((seccion) => (
                <option key={seccion.id} value={seccion.id}>
                  {seccion.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {cargando ? <Spinner texto="Cargando la carta…" /> : null}

      {!cargando && platosFiltrados.length === 0 ? (
        <EmptyState
          icono="restaurante"
          titulo="Sin platos"
          mensaje="No hay platos que coincidan. Añade el primero para empezar."
        />
      ) : null}

      {!cargando && platosFiltrados.length > 0 ? (
        <section className="bg-surface-container-low brutalist-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[70rem]">
              <thead className="bg-surface-container-highest/50 border-b-2 border-surface-variant">
                <tr>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Plato
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">
                    Sección
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-right">
                    Precio
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-center">
                    Disponible
                  </th>
                  <th className="px-6 py-5 font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {platosFiltrados.map((plato) => (
                  <tr
                    key={plato.id}
                    className="hover:bg-surface-container/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-surface-variant bg-black shrink-0 flex items-center justify-center">
                          {plato.imagen_url ? (
                            <img
                              src={plato.imagen_url}
                              alt={plato.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icono nombre="imagen" className="w-6 h-6 text-surface-variant" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-body-lg text-on-surface">
                            {plato.nombre}
                          </p>
                          <p className="text-label-sm text-tertiary opacity-70 max-w-md truncate">
                            {plato.descripcion}
                          </p>
                          {plato.etiqueta ? (
                            <span className="inline-block mt-1">
                              <Badge variante="destacado">{plato.etiqueta}</Badge>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge>{plato.seccion?.nombre ?? '—'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-body-lg text-primary font-bold">
                      {formatearPrecio(plato.precio)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={alternarDisponibilidad(plato)}
                        className={`p-2 rounded-lg transition-colors ${
                          plato.disponible
                            ? 'text-success hover:bg-success/20'
                            : 'text-tertiary hover:bg-surface-variant'
                        }`}
                        title={plato.disponible ? 'Disponible' : 'No disponible'}
                        aria-label={`Cambiar disponibilidad de ${plato.nombre}`}
                      >
                        <Icono
                          nombre={plato.disponible ? 'checkCirculo' : 'cancelar'}
                          className="w-6 h-6"
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            setPlatoEditando(plato);
                          }}
                          className="p-2 text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar"
                          aria-label={`Editar ${plato.nombre}`}
                        >
                          <Icono nombre="editar" className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            setPlatoAEliminar(plato);
                          }}
                          className="p-2 text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Eliminar"
                          aria-label={`Eliminar ${plato.nombre}`}
                        >
                          <Icono nombre="eliminar" className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {creando || platoEditando ? (
        <ModalPlato
          plato={platoEditando}
          secciones={secciones}
          onCerrar={() => {
            setCreando(false);
            setPlatoEditando(null);
          }}
          onGuardado={() => {
            setCreando(false);
            setPlatoEditando(null);
            recargar();
          }}
        />
      ) : null}

      <ConfirmDialog
        abierto={Boolean(platoAEliminar)}
        titulo="Eliminar plato"
        mensaje={`¿Seguro que quieres eliminar "${platoAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        peligroso
        cargando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPlatoAEliminar(null)}
      />
    </div>
  );
}

/**
 * Alta y edición de platos, con subida de imagen a Supabase Storage.
 */
function ModalPlato({ plato, secciones, onCerrar, onGuardado }) {
  const toast = useToast();
  const esEdicion = Boolean(plato);

  const [datos, setDatos] = useState({
    nombre: plato?.nombre ?? '',
    descripcion: plato?.descripcion ?? '',
    precio: plato?.precio ?? '',
    seccion_id: plato?.seccion_id ?? secciones[0]?.id ?? '',
    etiqueta: plato?.etiqueta ?? '',
    disponible: plato?.disponible ?? true,
    destacado: plato?.destacado ?? false,
    orden: plato?.orden ?? 0,
  });
  const [imagenUrl, setImagenUrl] = useState(plato?.imagen_url ?? '');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo) => (event) => {
    const valor =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setDatos((previos) => ({ ...previos, [campo]: valor }));
  };

  const subirImagen = async (event) => {
    const fichero = event.target.files?.[0];
    if (!fichero) return;

    if (!fichero.type.startsWith('image/')) {
      toast.error('El fichero debe ser una imagen.');
      return;
    }
    if (fichero.size > TAMANYO_MAXIMO_MB * 1024 * 1024) {
      toast.error(`La imagen no puede superar los ${TAMANYO_MAXIMO_MB} MB.`);
      return;
    }

    setSubiendo(true);
    const extension = fichero.name.split('.').pop();
    const nombreFichero = `${crypto.randomUUID()}.${extension}`;

    const { error: errorSubida } = await supabase.storage
      .from('platos')
      .upload(nombreFichero, fichero, { cacheControl: '3600', upsert: false });

    if (errorSubida) {
      setSubiendo(false);
      toast.error('No se pudo subir la imagen.');
      return;
    }

    const { data } = supabase.storage.from('platos').getPublicUrl(nombreFichero);
    setImagenUrl(data.publicUrl);
    setSubiendo(false);
    toast.exito('Imagen subida correctamente.');
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!datos.nombre.trim()) {
      toast.error('El plato necesita un nombre.');
      return;
    }
    if (!datos.seccion_id) {
      toast.error('Selecciona una sección para el plato.');
      return;
    }
    const precio = Number(datos.precio);
    if (Number.isNaN(precio) || precio < 0) {
      toast.error('Introduce un precio válido.');
      return;
    }

    setGuardando(true);
    const registro = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      precio,
      seccion_id: datos.seccion_id,
      etiqueta: datos.etiqueta || null,
      disponible: datos.disponible,
      destacado: datos.destacado,
      orden: Number(datos.orden) || 0,
      imagen_url: imagenUrl || null,
    };

    const { error } = esEdicion
      ? await supabase.from('platos').update(registro).eq('id', plato.id)
      : await supabase.from('platos').insert(registro);

    setGuardando(false);

    if (error) {
      toast.error('No se pudo guardar el plato.');
      return;
    }

    toast.exito(esEdicion ? 'Plato actualizado.' : 'Plato creado.');
    onGuardado();
  };

  return (
    <Modal
      abierto
      titulo={esEdicion ? 'Editar plato' : 'Nuevo plato'}
      onCerrar={onCerrar}
      ancho="max-w-3xl"
    >
      <form onSubmit={manejarEnvio} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Imagen */}
          <div>
            <span className="etiqueta-formulario">Imagen del plato</span>
            <div className="aspect-square rounded-xl border-2 border-dashed border-surface-variant bg-surface overflow-hidden flex items-center justify-center mb-3">
              {imagenUrl ? (
                <img
                  src={imagenUrl}
                  alt="Vista previa del plato"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <Icono
                    nombre="imagen"
                    className="w-12 h-12 text-surface-variant mx-auto mb-2"
                  />
                  <p className="text-label-sm text-tertiary">Sin imagen</p>
                </div>
              )}
            </div>

            <label
              htmlFor="imagen-plato"
              className="btn-secundario w-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icono nombre="subir" className="w-5 h-5" />
              {subiendo ? 'Subiendo…' : 'Subir imagen'}
            </label>
            <input
              id="imagen-plato"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={subirImagen}
              disabled={subiendo}
            />
            {imagenUrl ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setImagenUrl('');
                }}
                className="w-full mt-2 text-label-sm text-error hover:underline"
              >
                Quitar imagen
              </button>
            ) : null}
          </div>

          {/* Datos */}
          <div className="space-y-4">
            <div>
              <label htmlFor="plato-nombre" className="etiqueta-formulario">
                Nombre
              </label>
              <input
                id="plato-nombre"
                type="text"
                className="campo-formulario"
                value={datos.nombre}
                onChange={actualizar('nombre')}
                placeholder="Broster Clásico"
                required
              />
            </div>

            <div>
              <label htmlFor="plato-seccion" className="etiqueta-formulario">
                Sección
              </label>
              <select
                id="plato-seccion"
                className="campo-formulario"
                value={datos.seccion_id}
                onChange={actualizar('seccion_id')}
                required
              >
                {secciones.map((seccion) => (
                  <option key={seccion.id} value={seccion.id}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="plato-precio" className="etiqueta-formulario">
                  Precio (€)
                </label>
                <input
                  id="plato-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  className="campo-formulario"
                  value={datos.precio}
                  onChange={actualizar('precio')}
                  placeholder="12.90"
                  required
                />
              </div>
              <div>
                <label htmlFor="plato-orden" className="etiqueta-formulario">
                  Orden
                </label>
                <input
                  id="plato-orden"
                  type="number"
                  min="0"
                  className="campo-formulario"
                  value={datos.orden}
                  onChange={actualizar('orden')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="plato-etiqueta" className="etiqueta-formulario">
                Etiqueta
              </label>
              <select
                id="plato-etiqueta"
                className="campo-formulario"
                value={datos.etiqueta}
                onChange={actualizar('etiqueta')}
              >
                {ETIQUETAS.map((etiqueta) => (
                  <option key={etiqueta || 'ninguna'} value={etiqueta}>
                    {etiqueta || 'Sin etiqueta'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="plato-descripcion" className="etiqueta-formulario">
            Descripción
          </label>
          <textarea
            id="plato-descripcion"
            rows={3}
            className="campo-formulario resize-none"
            value={datos.descripcion}
            onChange={actualizar('descripcion')}
            placeholder="Piezas de pollo marinadas 24 horas y fritas con especias de la casa…"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded bg-surface border-2 border-surface-variant text-primary-container focus:ring-primary"
              checked={datos.disponible}
              onChange={actualizar('disponible')}
            />
            <span className="text-body-md text-on-surface">Disponible en la carta</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded bg-surface border-2 border-surface-variant text-primary-container focus:ring-primary"
              checked={datos.destacado}
              onChange={actualizar('destacado')}
            />
            <span className="text-body-md text-on-surface">
              Destacar como plato estrella
            </span>
          </label>
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
          <button
            type="submit"
            className="btn-primario"
            disabled={guardando || subiendo}
          >
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear plato'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
