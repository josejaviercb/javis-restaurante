import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePlatos, useSecciones } from '../../hooks/usePlatos';
import PlatoCard from '../../components/carta/PlatoCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function Carta() {
  const { platos, cargando, error } = usePlatos();
  const { secciones } = useSecciones();

  // La sección activa vive en la URL (?seccion=bebidas) para que se
  // mantenga al refrescar y el enlace se pueda compartir.
  const [parametros, setParametros] = useSearchParams();
  const filtro = parametros.get('seccion') ?? 'todos';

  // Una URL puede traer un slug que no corresponde a ninguna sección.
  // Se espera a tener las secciones cargadas para no dar un falso negativo.
  const seccionExiste =
    filtro === 'todos' ||
    secciones.length === 0 ||
    secciones.some((seccion) => seccion.slug === filtro);

  const platosFiltrados = useMemo(() => {
    if (filtro === 'todos') return platos;
    return platos.filter((plato) => plato.seccion?.slug === filtro);
  }, [platos, filtro]);

  const cambiarFiltro = (slug) => (event) => {
    event.preventDefault();
    // 'todos' es el valor por defecto, así que se omite de la URL.
    // replace evita llenar el historial al cambiar de pestaña.
    setParametros(slug === 'todos' ? {} : { seccion: slug }, { replace: true });
  };

  const claseBoton = (activo) =>
    activo
      ? 'bg-primary text-on-primary px-7 py-3 font-bold text-label-bold uppercase whitespace-nowrap rounded-full shadow-md shadow-primary/20 transition-all'
      : 'bg-surface-container text-on-surface-variant px-7 py-3 font-bold text-label-bold uppercase whitespace-nowrap rounded-full border border-on-surface/10 hover:border-primary hover:text-primary transition-all';

  return (
    <div>
      {/* Cabecera con imagen de fondo */}
      <header className="relative overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1550317138-10000687a72b?w=1600&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50"
          aria-hidden="true"
        />
        <div className="relative z-10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-24 pb-16">
          <span className="inline-flex items-center gap-2 text-label-bold uppercase tracking-widest text-primary mb-4">
            <span className="w-8 h-px bg-primary" aria-hidden="true" />
            La carta
          </span>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-xl uppercase leading-none mb-6 text-on-surface">
            Nuestra carta
          </h1>
          <p className="text-body-lg text-on-surface/80 max-w-2xl">
            Hamburguesas smash, pollo broster y papas fritas de calidad premium,
            ingredientes frescos y ese toque callejero que nos define. Elige tu arma y
            prepárate para el KO.
          </p>
        </div>
      </header>

      <div className="px-margin-mobile md:px-margin-desktop pb-24 max-w-container-max mx-auto">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 mb-4">
          <button type="button" onClick={cambiarFiltro('todos')} className={claseBoton(filtro === 'todos')}>
            Todos
          </button>
          {secciones.map((seccion) => (
            <button
              key={seccion.id}
              type="button"
              onClick={cambiarFiltro(seccion.slug)}
              className={claseBoton(filtro === seccion.slug)}
            >
              {seccion.nombre}
            </button>
          ))}
        </div>

      {cargando ? <Spinner texto="Cargando la carta…" /> : null}

      {!cargando && error ? (
        <EmptyState icono="aviso" titulo="Error al cargar" mensaje={error} />
      ) : null}

      {!cargando && !error && platosFiltrados.length === 0 ? (
        <EmptyState
          icono="restaurante"
          titulo={seccionExiste ? 'Sin platos en esta sección' : 'Sección no encontrada'}
          mensaje={
            seccionExiste
              ? 'Prueba con otra categoría o vuelve pronto: la carta cambia a menudo.'
              : 'Esa sección no existe en nuestra carta. Echa un vistazo al resto.'
          }
        >
          {!seccionExiste ? (
            <button type="button" onClick={cambiarFiltro('todos')} className="btn-primario">
              Ver toda la carta
            </button>
          ) : null}
        </EmptyState>
      ) : null}

      {!cargando && platosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {platosFiltrados.map((plato) => (
            <PlatoCard key={plato.id} plato={plato} />
          ))}
        </div>
      ) : null}

        <div className="mt-16 relative overflow-hidden rounded-2xl shadow-xl shadow-black/40">
          <img
            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600&q=80"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/40"
            aria-hidden="true"
          />
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="font-headline text-headline-md uppercase text-on-surface mb-2">
                ¿Te has decidido ya?
              </h2>
              <p className="text-body-lg text-on-surface/80">
                Reserva tu mesa y ven a probarlo en persona.
              </p>
            </div>
            <Link to="/reservas" className="btn-primario whitespace-nowrap">
              Reservar mesa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

