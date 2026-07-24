export default function Spinner({ texto = 'Cargando…', pantallaCompleta = false }) {
  const contenido = (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-12 h-12 border-4 border-surface-variant border-t-primary-container rounded-full animate-spin"
        role="progressbar"
        aria-label={texto}
      />
      {texto ? <p className="text-body-md text-tertiary">{texto}</p> : null}
    </div>
  );

  if (pantallaCompleta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {contenido}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-16">{contenido}</div>;
}
