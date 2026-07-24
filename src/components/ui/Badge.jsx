const VARIANTES = {
  pendiente: 'bg-warning-container text-warning border-warning/40',
  confirmada: 'bg-success-container text-success border-success/40',
  cancelada: 'bg-error-container/40 text-error border-error/40',
  neutro: 'bg-secondary-container text-on-secondary-container border-surface-variant',
  destacado: 'bg-primary-container text-on-primary-container border-primary-container',
};

const ETIQUETAS_ESTADO = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
};

export default function Badge({ variante = 'neutro', children }) {
  const estilo = VARIANTES[variante] ?? VARIANTES.neutro;

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full border text-label-sm font-bold uppercase tracking-wider whitespace-nowrap ${estilo}`}
    >
      {children}
    </span>
  );
}

export function BadgeEstado({ estado }) {
  return <Badge variante={estado}>{ETIQUETAS_ESTADO[estado] ?? estado}</Badge>;
}
