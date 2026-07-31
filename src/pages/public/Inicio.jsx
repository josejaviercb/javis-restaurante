import { Link } from 'react-router-dom';
import { usePlatos } from '../../hooks/usePlatos';
import PlatoCard from '../../components/carta/PlatoCard';
import Icono from '../../components/ui/Icono';
import Spinner from '../../components/ui/Spinner';
import combo from '../../assets/combo.png';

// Imágenes de Unsplash (uso libre). Se cargan desde su CDN.
const IMG = {
  hero: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&q=80',
  historia: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80',
  cta: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=1600&q=80',
};

const CATEGORIAS = [
  {
    nombre: 'Hamburguesas',
    slug: 'hamburguesas',
    descripcion: 'Smash de carne madurada',
    imagen: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
  },
  {
    nombre: 'Pollo Broster',
    slug: 'pollo-broster',
    descripcion: 'Crujiente y marinado 24h',
    imagen: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
  },
  {
    nombre: 'Papas Fritas',
    slug: 'papas-fritas',
    descripcion: 'Caseras y doradas',
    imagen: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80',
  },
];

const RESENYAS = [
  {
    id: 1,
    texto:
      'La mejor hamburguesa smash que he probado en mi vida, pero el pollo broster me sorprendió todavía más. El local tiene un rollo increíble.',
    autor: 'Marcos Alonso',
    cargo: 'Google Local Guide',
    iniciales: 'MA',
    estrellas: 5,
    color: 'bg-primary-container text-on-primary-container',
  },
  {
    id: 2,
    texto:
      'Brutalismo puro. La Inferno Smash pica de verdad y las papas con queso y bacon son un vicio. Volveré cada semana.',
    autor: 'Lucía Castro',
    cargo: 'Cliente habitual',
    iniciales: 'LC',
    estrellas: 4,
    color: 'bg-secondary-container text-on-secondary-container',
  },
  {
    id: 3,
    texto:
      'No hay marketing aquí, solo producto real. Desde la carne hasta el pollo broster, la calidad se nota desde el primer bocado.',
    autor: 'Raúl Pérez',
    cargo: 'Crítico gastronómico',
    iniciales: 'RP',
    estrellas: 5,
    color: 'bg-tertiary-container text-on-tertiary-container',
  },
];

export default function Inicio() {
  const { platos, cargando } = usePlatos({ soloDestacados: true });

  return (
    <div>
      {/* Hero con imagen full-bleed */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <img
          src={IMG.hero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Capa negra semitransparente para dar legibilidad al texto */}
        <div className="absolute inset-0 bg-black/80" aria-hidden="true" />

        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Texto */}
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-2 text-label-bold uppercase tracking-widest text-primary mb-6">
                <span className="w-8 h-px bg-primary" aria-hidden="true" />
                Cocina callejera premium
              </span>
              <h1 className="font-headline text-headline-lg-mobile md:text-headline-xl uppercase mb-6 leading-none text-on-surface">
                Más que una hamburguesa,
                <br />
                <span className="text-primary">un impacto brutal.</span>
              </h1>
              <p className="text-body-lg text-on-surface/80 mb-10 max-w-xl">
                Hamburguesas smash, pollo broster crujiente y papas fritas caseras. Cada
                receta con producto premium y ese sabor que te hará olvidar cualquier otra
                cosa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/reservas"
                  className="bg-primary text-on-primary px-10 py-5 font-bold text-label-bold uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all text-center"
                >
                  Reservar mesa
                </Link>
                <Link
                  to="/carta"
                  className="bg-on-surface/5 backdrop-blur-sm text-on-surface px-10 py-5 font-bold text-label-bold uppercase tracking-widest rounded-lg border border-on-surface/15 hover:border-primary hover:text-primary transition-all text-center"
                >
                  Ver carta
                </Link>
              </div>
            </div>

            {/* Imagen del combo (hamburguesa, pollo broster y papas) */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <img
                src={combo}
                alt="Combo Snakko: hamburguesa, pollo broster y papas fritas"
                className="w-full max-w-[63rem] object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categorías con imagen */}
      <section className="py-20 md:py-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-label-bold uppercase tracking-widest text-primary">
              Nuestra especialidad
            </span>
            <h2 className="font-headline text-headline-lg-mobile md:text-headline-lg uppercase mt-2 text-on-surface">
              Tres formas de rendirse
            </h2>
          </div>
          <Link
            to="/carta"
            className="text-body-md text-tertiary hover:text-primary transition-colors font-bold uppercase tracking-wider self-start md:self-auto"
          >
            Ver carta completa →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIAS.map((categoria) => (
            <Link
              key={categoria.slug}
              to={`/carta?seccion=${categoria.slug}`}
              className="group relative h-80 rounded-2xl overflow-hidden shadow-xl shadow-black/40"
            >
              <img
                src={categoria.imagen}
                alt={categoria.nombre}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <span className="text-label-sm uppercase tracking-widest text-primary mb-1">
                  {categoria.descripcion}
                </span>
                <h3 className="font-headline text-3xl uppercase text-white leading-none">
                  {categoria.nombre}
                </h3>
                <span className="mt-3 inline-flex items-center gap-2 text-label-bold uppercase text-white/0 group-hover:text-white transition-all -translate-x-2 group-hover:translate-x-0">
                  Descubrir
                  <Icono nombre="flechaDerecha" className="w-5 h-5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Nuestra historia con foto */}
      <section className="py-20 md:py-28 bg-surface-container-lowest">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 aspect-[4/3]">
              <img
                src={IMG.historia}
                alt="Nuestra cocina"
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-primary/95 backdrop-blur-sm rounded-xl p-6 flex items-center gap-4">
                <Icono
                  nombre="checkCirculo"
                  className="w-10 h-10 text-on-primary shrink-0"
                />
                <p className="font-bold text-label-bold text-on-primary uppercase leading-tight">
                  Producto local y certificado de origen garantizado
                </p>
              </div>
            </div>

            <div>
              <span className="text-label-bold uppercase tracking-widest text-primary">
                Nuestra historia
              </span>
              <h2 className="font-headline text-headline-lg-mobile md:text-headline-lg uppercase mt-2 mb-6 text-on-surface">
                El origen del caos
              </h2>
              <p className="text-body-lg text-tertiary leading-relaxed mb-6">
                Nacimos en el corazón de la urbe con una sola misión: llevar a la mesa
                comida callejera hecha con técnica y sin adornos innecesarios.
                Hamburguesas smash, pollo broster marinado y papas fritas caseras, todo
                con fuego, hierro y calidad suprema.
              </p>
              <p className="text-body-lg text-tertiary leading-relaxed">
                Nuestra técnica de smash no es solo cocina, es ingeniería. Aplicamos ese
                mismo cuidado a cada pieza de pollo broster y cada tanda de papas: nada
                sale de la cocina sin pasar el control de calidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platos estrella */}
      <section className="py-20 md:py-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-label-bold uppercase tracking-widest text-primary">
              Los favoritos
            </span>
            <h2 className="font-headline text-headline-lg-mobile md:text-headline-lg uppercase mt-2 flex items-center gap-4 text-on-surface">
              Platos estrella
              <Icono nombre="estrella" className="w-10 h-10 text-primary shrink-0" />
            </h2>
          </div>
        </div>

        {cargando ? <Spinner texto="Cargando platos…" /> : null}

        {!cargando && platos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {platos.slice(0, 3).map((plato) => (
              <PlatoCard key={plato.id} plato={plato} />
            ))}
          </div>
        ) : null}

        {!cargando && platos.length === 0 ? (
          <p className="text-body-lg text-tertiary">
            Pronto publicaremos nuestros platos destacados.
          </p>
        ) : null}

        <div className="mt-12 text-center">
          <Link to="/carta" className="btn-secundario inline-block">
            Ver la carta completa
          </Link>
        </div>
      </section>

      {/* Reseñas */}
      <section className="py-20 md:py-28 bg-surface-container-lowest">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <span className="text-label-bold uppercase tracking-widest text-primary">
              Testimonios
            </span>
            <h2 className="font-headline text-headline-lg-mobile md:text-headline-lg uppercase mt-2 text-on-surface">
              Lo que dicen en la calle
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {RESENYAS.map((resenya) => (
              <article
                key={resenya.id}
                className="bg-surface rounded-2xl p-8 border border-on-surface/5 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all"
              >
                <div
                  className="flex mb-5 text-primary"
                  aria-label={`${resenya.estrellas} de 5 estrellas`}
                >
                  {[1, 2, 3, 4, 5].map((posicion) => (
                    <Icono
                      key={posicion}
                      nombre="estrella"
                      className={`w-5 h-5 ${posicion <= resenya.estrellas ? 'text-primary' : 'text-surface-variant'}`}
                    />
                  ))}
                </div>
                <blockquote className="text-body-lg text-on-surface mb-6 italic leading-relaxed">
                  «{resenya.texto}»
                </blockquote>
                <footer className="flex items-center gap-4 pt-6 border-t border-on-surface/10">
                  <span
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-label-bold shrink-0 ${resenya.color}`}
                  >
                    {resenya.iniciales}
                  </span>
                  <div>
                    <p className="font-bold text-label-bold text-on-surface uppercase">
                      {resenya.autor}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {resenya.cargo}
                    </p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Llamada final con imagen de fondo */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        <img
          src={IMG.cta}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-primary/90 mix-blend-multiply"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-margin-mobile md:px-margin-desktop">
          <h2 className="font-headline text-headline-lg-mobile md:text-headline-xl text-white uppercase mb-8 leading-none drop-shadow-lg">
            ¿Tienes hambre de verdad?
          </h2>
          <p className="text-body-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Reserva tu mesa en menos de un minuto y asegúrate tu sitio en Snakko.
          </p>
          <Link
            to="/reservas"
            className="inline-block bg-white text-primary px-12 py-5 font-bold text-label-bold uppercase tracking-widest hover:scale-105 transition-transform rounded-lg shadow-xl"
          >
            Reservar ahora
          </Link>
        </div>
      </section>
    </div>
  );
}
