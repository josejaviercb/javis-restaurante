import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

/**
 * Exige sesión iniciada. Mientras se comprueba la sesión muestra un
 * spinner, para no redirigir a login por error en la primera carga.
 */
export default function ProtectedRoute({ children }) {
  const { estaAutenticado, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return <Spinner texto="Comprobando tu sesión…" pantallaCompleta />;
  }

  if (!estaAutenticado) {
    // Se guarda el destino para volver a él tras iniciar sesión.
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />;
  }

  return children;
}
