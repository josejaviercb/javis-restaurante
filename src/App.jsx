import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

import Inicio from './pages/public/Inicio';
import Carta from './pages/public/Carta';
import Reservas from './pages/public/Reservas';
import MisReservas from './pages/public/MisReservas';
import MiPerfil from './pages/public/MiPerfil';
import Login from './pages/public/Login';
import Registro from './pages/public/Registro';
import SinPermiso from './pages/public/SinPermiso';
import NoEncontrado from './pages/public/NoEncontrado';

import Dashboard from './pages/admin/Dashboard';
import AdminReservas from './pages/admin/AdminReservas';
import AdminCarta from './pages/admin/AdminCarta';
import AdminSecciones from './pages/admin/AdminSecciones';
import AdminClientes from './pages/admin/AdminClientes';

export default function App() {
  return (
    <Routes>
      {/* Parte pública */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/carta" element={<Carta />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/sin-permiso" element={<SinPermiso />} />

        {/* Requieren sesión iniciada */}
        <Route
          path="/reservas"
          element={
            <ProtectedRoute>
              <Reservas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-reservas"
          element={
            <ProtectedRoute>
              <MisReservas />
            </ProtectedRoute>
          }
        />
        {/* Editar perfil: disponible para cualquier usuario con sesión,
            sin importar su rol (cliente, administrador o futuros roles). */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <MiPerfil />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NoEncontrado />} />
      </Route>

      {/* Panel de administración */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="reservas" element={<AdminReservas />} />
        <Route path="carta" element={<AdminCarta />} />
        <Route path="secciones" element={<AdminSecciones />} />
        <Route path="clientes" element={<AdminClientes />} />
      </Route>
    </Routes>
  );
}
