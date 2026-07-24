import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useSecciones } from '../../hooks/usePlatos';
import Icono from '../../components/ui/Icono';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

/** Convierte 'Pollo Broster' en 'pollo-broster'. */
function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminSecciones() {
  const { secciones, cargando, recargar } = useSecciones({ soloActivas: false });
  const toast = useToast();

  const [seccionEditando, setSeccionEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [seccionAEliminar, setSeccionAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const confirmarEliminacion = async () => {
    setEliminando(true);

    // Una sección con platos no puede borrarse: se avisa en vez de fallar.
    const { count } = await supabase
      .from('platos')
      .select('id', { count: 'exact', head: true })
      .eq('seccion_id', seccionAEliminar.id);

    if (count && count > 0) {
      setEliminando(false);
      setSeccionAEliminar(null);
      toast.error(
        `No se puede eliminar: la sección tiene ${count} plato(s). Muévelos o elimínalos antes.`
      );
      return;
    }

    const { error } = await supabase
      .from('secciones')
      .delete()
      .eq('id', seccionAEliminar.id);

    setEliminando(false);
    setSeccionAEliminar(null);

    if (error) {
      toast.error('No se pudo eliminar la sección.');
      return;
    }

    toast.exito('Sección eliminada.');
    recargar();
  };

  const alternarActiva = (seccion) => async (event) => {
    event.preventDefault();
    const { error } = await supabase
      .from('secciones')
      .update({ activa: !seccion.activa })
      .eq('id', seccion.id);

    if (error) {
      toast.error('No se pudo cambiar el estado de la sección.');
      return;
    }
    recargar();
  };

  return (
    <div>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase">
            Secciones de la carta
          </h1>
          <p className="text-body-lg text-tertiary">
            Organiza cómo se agrupan los platos en la carta pública.
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
          Nueva sección
        </button>
      </header>

      {cargando ? <Spinner texto="Cargando secciones…" /> : null}

      {!cargando && secciones.length === 0 ? (
        <EmptyState
          icono="ajustes"
          titulo="Sin secciones"
          mensaje="Crea la primera sección para poder organizar la carta."
        />
      ) : null}

      {!cargando && secciones.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {secciones.map((seccion) => (
            <article
              key={seccion.id}
              className="bg-surface-container-low brutalist-border rounded-xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-headline text-2xl uppercase text-on-surface">
                    {seccion.nombre}
                  </h2>
                  <p className="text-label-sm text-tertiary">/{seccion.slug}</p>
                </div>
                <Badge variante={seccion.activa ? 'confirmada' : 'cancelada'}>
                  {seccion.activa ? 'Activa' : 'Oculta'}
                </Badge>
              </div>

              <p className="text-label-sm text-tertiary">
                Orden de aparición: {seccion.orden}
              </p>

              <div className="flex gap-2 mt-auto pt-4 border-t border-surface-variant">
                <button
                  type="button"
                  onClick={alternarActiva(seccion)}
                  className="flex-1 py-2 text-label-bold font-bold uppercase text-tertiary hover:text-primary transition-colors"
                >
                  {seccion.activa ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setSeccionEditando(seccion);
                  }}
                  className="p-2 text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  aria-label={`Editar ${seccion.nombre}`}
                >
                  <Icono nombre="editar" className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setSeccionAEliminar(seccion);
                  }}
                  className="p-2 text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  aria-label={`Eliminar ${seccion.nombre}`}
                >
                  <Icono nombre="eliminar" className="w-5 h-5" />
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {creando || seccionEditando ? (
        <ModalSeccion
          seccion={seccionEditando}
          onCerrar={() => {
            setCreando(false);
            setSeccionEditando(null);
          }}
          onGuardado={() => {
            setCreando(false);
            setSeccionEditando(null);
            recargar();
          }}
        />
      ) : null}

      <ConfirmDialog
        abierto={Boolean(seccionAEliminar)}
        titulo="Eliminar sección"
        mensaje={`¿Seguro que quieres eliminar la sección "${seccionAEliminar?.nombre}"?`}
        textoConfirmar="Sí, eliminar"
        peligroso
        cargando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setSeccionAEliminar(null)}
      />
    </div>
  );
}

function ModalSeccion({ seccion, onCerrar, onGuardado }) {
  const toast = useToast();
  const esEdicion = Boolean(seccion);

  const [datos, setDatos] = useState({
    nombre: seccion?.nombre ?? '',
    slug: seccion?.slug ?? '',
    orden: seccion?.orden ?? 0,
    activa: seccion?.activa ?? true,
  });
  const [guardando, setGuardando] = useState(false);

  const actualizarNombre = (event) => {
    const nombre = event.target.value;
    setDatos((previos) => ({
      ...previos,
      nombre,
      // En creación el slug se deriva del nombre; en edición no se toca
      // para no romper enlaces existentes.
      slug: esEdicion ? previos.slug : generarSlug(nombre),
    }));
  };

  const actualizar = (campo) => (event) => {
    const valor =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setDatos((previos) => ({ ...previos, [campo]: valor }));
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!datos.nombre.trim()) {
      toast.error('La sección necesita un nombre.');
      return;
    }

    const slugFinal = generarSlug(datos.slug || datos.nombre);
    if (!slugFinal) {
      toast.error('El identificador de la sección no es válido.');
      return;
    }

    setGuardando(true);
    const registro = {
      nombre: datos.nombre.trim(),
      slug: slugFinal,
      orden: Number(datos.orden) || 0,
      activa: datos.activa,
    };

    const { error } = esEdicion
      ? await supabase.from('secciones').update(registro).eq('id', seccion.id)
      : await supabase.from('secciones').insert(registro);

    setGuardando(false);

    if (error) {
      const mensaje = error.message.includes('duplicate')
        ? 'Ya existe una sección con ese identificador.'
        : 'No se pudo guardar la sección.';
      toast.error(mensaje);
      return;
    }

    toast.exito(esEdicion ? 'Sección actualizada.' : 'Sección creada.');
    onGuardado();
  };

  return (
    <Modal
      abierto
      titulo={esEdicion ? 'Editar sección' : 'Nueva sección'}
      onCerrar={onCerrar}
      ancho="max-w-xl"
    >
      <form onSubmit={manejarEnvio} className="space-y-5">
        <div>
          <label htmlFor="seccion-nombre" className="etiqueta-formulario">
            Nombre
          </label>
          <input
            id="seccion-nombre"
            type="text"
            className="campo-formulario"
            value={datos.nombre}
            onChange={actualizarNombre}
            placeholder="Pollo Broster"
            required
          />
        </div>

        <div>
          <label htmlFor="seccion-slug" className="etiqueta-formulario">
            Identificador
          </label>
          <input
            id="seccion-slug"
            type="text"
            className="campo-formulario"
            value={datos.slug}
            onChange={actualizar('slug')}
            placeholder="pollo-broster"
          />
          <p className="text-label-sm text-tertiary mt-2">
            Se usa internamente para filtrar la carta. Solo letras, números y guiones.
          </p>
        </div>

        <div>
          <label htmlFor="seccion-orden" className="etiqueta-formulario">
            Orden de aparición
          </label>
          <input
            id="seccion-orden"
            type="number"
            min="0"
            className="campo-formulario"
            value={datos.orden}
            onChange={actualizar('orden')}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded bg-surface border-2 border-surface-variant text-primary-container focus:ring-primary"
            checked={datos.activa}
            onChange={actualizar('activa')}
          />
          <span className="text-body-md text-on-surface">
            Visible en la carta pública
          </span>
        </label>

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
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear sección'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
