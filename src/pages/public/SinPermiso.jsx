import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';

export default function SinPermiso() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop py-16">
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icono="candado"
          titulo="Acceso restringido"
          mensaje="Esta zona es solo para administradores. Si crees que deberías tener acceso, contacta con el responsable del restaurante."
        >
          <Link to="/" className="btn-primario">
            Volver al inicio
          </Link>
        </EmptyState>
      </div>
    </section>
  );
}
