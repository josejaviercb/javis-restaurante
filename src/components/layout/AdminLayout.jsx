import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Icono from '../ui/Icono';
import { obtenerIniciales } from '../../lib/formato';

const ENLACES_ADMIN = [
  { a: '/admin', texto: 'Dashboard', icono: 'panel', exacto: true },
  { a: '/admin/reservas', texto: 'Reservas', icono: 'calendario' },
  { a: '/admin/carta', texto: 'Carta', icono: 'restaurante' },
  { a: '/admin/secciones', texto: 'Secciones', icono: 'ajustes' },
  { a: '/admin/clientes', texto: 'Clientes', icono: 'grupo' },
];

export default function AdminLayout() {
  const { perfil, cerrarSesion } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const manejarCierreSesion = async (event) => {
    event.preventDefault();
    const { error } = await cerrarSesion();
    if (error) {
      toast.error('No se pudo cerrar la sesión.');
      return;
    }
    navegar('/');
  };

  const alternarMenu = (event) => {
    event.preventDefault();
    setMenuAbierto((abierto) => !abierto);
  };

  const claseEnlace = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-3 px-4 py-3 bg-primary text-on-primary font-bold rounded-lg transition-all'
      : 'flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg';

  const barraLateral = (
    <div className="flex flex-col h-full p-6">
      <div className="mb-8">
        <Link to="/" className="font-headline text-3xl text-primary tracking-tighter leading-none">
          JAVI'S
        </Link>
        <p className="font-bold text-label-sm text-on-surface-variant uppercase opacity-70 mt-1">
          Panel de administración
        </p>
      </div>

      <nav className="flex-grow space-y-2">
        {ENLACES_ADMIN.map((enlace) => (
          <NavLink
            key={enlace.a}
            to={enlace.a}
            end={enlace.exacto}
            onClick={() => setMenuAbierto(false)}
            className={claseEnlace}
          >
            <Icono nombre={enlace.icono} className="w-6 h-6 shrink-0" />
            <span className="font-bold text-label-bold">{enlace.texto}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-surface-variant space-y-4">
        <Link
          to="/perfil"
          onClick={() => setMenuAbierto(false)}
          className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg"
        >
          <Icono nombre="usuario" className="w-6 h-6 shrink-0" />
          <span className="font-bold text-label-bold">Mi perfil</span>
        </Link>
        <Link
          to="/"
          onClick={() => setMenuAbierto(false)}
          className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all rounded-lg"
        >
          <Icono nombre="restaurante" className="w-6 h-6 shrink-0" />
          <span className="font-bold text-label-bold">Ver la web</span>
        </Link>
        <button
          type="button"
          onClick={manejarCierreSesion}
          className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error/10 transition-all rounded-lg"
        >
          <Icono nombre="salir" className="w-6 h-6 shrink-0" />
          <span className="font-bold text-label-bold">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-dim">
      {/* Barra lateral fija en escritorio */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-surface-container-low border-r-2 border-surface-variant z-40">
        {barraLateral}
      </aside>

      {/* Cabecera móvil */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-margin-mobile py-4 bg-surface-container-low border-b-2 border-surface-variant">
        <Link to="/admin" className="font-headline text-2xl text-primary tracking-tighter">
          JAVI'S
        </Link>
        <button
          type="button"
          onClick={alternarMenu}
          className="text-on-surface hover:text-primary transition-colors p-2"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
        >
          <Icono nombre={menuAbierto ? 'cerrar' : 'menu'} className="w-7 h-7" />
        </button>
      </header>

      {/* Menú lateral móvil */}
      {menuAbierto ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuAbierto(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface-container-low border-r-2 border-surface-variant animate-slide-in-right">
            {barraLateral}
          </div>
        </div>
      ) : null}

      <div className="lg:ml-64">
        {/* Cabecera de usuario en escritorio */}
        <div className="hidden lg:flex justify-end px-margin-desktop pt-8">
          <div className="flex items-center gap-4 bg-surface-container-high p-2 pr-5 rounded-xl brutalist-border">
            <span className="w-11 h-11 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
              {obtenerIniciales(perfil?.nombre)}
            </span>
            <div>
              <p className="font-bold text-label-bold text-on-surface leading-tight">
                {perfil?.nombre || 'Administrador'}
              </p>
              <p className="text-label-sm text-primary">Javi's</p>
            </div>
          </div>
        </div>

        <main className="px-margin-mobile md:px-margin-desktop py-8 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
