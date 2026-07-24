import Icono from '../ui/Icono';
import { formatearPrecio } from '../../lib/formato';

// Cada etiqueta tiene su color de marca.
const COLORES_ETIQUETA = {
  Popular: 'bg-black/80 text-white backdrop-blur-sm',
  'Best Seller': 'bg-primary text-on-primary',
  Picante: 'bg-error text-on-error',
  Vegano: 'bg-secondary text-on-secondary',
};

export default function PlatoCard({ plato }) {
  const colorEtiqueta =
    COLORES_ETIQUETA[plato.etiqueta] ?? 'bg-surface-variant text-on-surface';

  return (
    <article className="group h-full">
      <div className="bg-surface-container-low rounded-2xl overflow-hidden flex flex-col h-full border border-on-surface/5 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10">
        <div className="h-60 relative overflow-hidden bg-surface-container-high shrink-0">
          {plato.imagen_url ? (
            <img
              src={plato.imagen_url}
              alt={plato.nombre}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-variant">
              <Icono nombre="restaurante" className="w-16 h-16" />
            </div>
          )}

          {/* Degradado sutil para dar profundidad al pie de la imagen */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-surface-container-low/60 to-transparent"
            aria-hidden="true"
          />

          {plato.etiqueta ? (
            <span
              className={`absolute top-4 left-4 text-label-sm font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md ${colorEtiqueta}`}
            >
              {plato.etiqueta}
            </span>
          ) : null}
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start gap-4 mb-3">
            <h3 className="font-headline text-2xl uppercase text-on-surface leading-tight">
              {plato.nombre}
            </h3>
            <span className="text-body-lg text-primary font-bold whitespace-nowrap">
              {formatearPrecio(plato.precio)}
            </span>
          </div>
          <p className="text-tertiary text-body-md flex-grow leading-relaxed">
            {plato.descripcion}
          </p>
        </div>
      </div>
    </article>
  );
}
