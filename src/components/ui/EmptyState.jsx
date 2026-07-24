import Icono from './Icono';

export default function EmptyState({
  icono = 'vacio',
  titulo,
  mensaje,
  children,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-20 h-20 rounded-xl bg-surface-container-high flex items-center justify-center mb-6 brutalist-border">
        <Icono nombre={icono} className="w-10 h-10 text-tertiary" />
      </div>
      <h3 className="font-headline text-headline-md text-on-surface uppercase mb-3">
        {titulo}
      </h3>
      {mensaje ? (
        <p className="text-body-md text-tertiary max-w-md mb-6">{mensaje}</p>
      ) : null}
      {children}
    </div>
  );
}
