import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

/**
 * Exige sesión iniciada Y rol de administrador. El rol se asigna
 * manualmente en la base de datos.
 */
export default function AdminRoute({ children }) {
  const { estaAutenticado, esAdmin, perfil, cargando } = useAuth();
  const ubicacion = useLocation();

  // El perfil llega en una segunda consulta: hay que esperarlo antes de
  // decidir, o un administrador vería un rechazo momentáneo.
  if (cargando || (estaAutenticado && !perfil)) {
    return <Spinner texto="Comprobando permisos…" pantallaCompleta />;
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />;
  }

  if (!esAdmin) {
    return <Navigate to="/sin-permiso" replace />;
  }

  return children;
}
