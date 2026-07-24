import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Icono from '../ui/Icono';
import logoHorizontal from '../../assets/logo-horizontal.png';

const ENLACES = [
  { a: '/', texto: 'Inicio' },
  { a: '/carta', texto: 'Menú' },
  { a: '/reservas', texto: 'Reservas' },
];

export default function Header() {
  const { estaAutenticado, esAdmin, perfil, cerrarSesion } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const claseEnlace = ({ isActive }) =>
    isActive
      ? 'text-primary font-bold border-b-2 border-primary pb-1 transition-colors'
      : 'text-on-surface-variant hover:text-primary transition-colors duration-200';

  const manejarCierreSesion = async (event) => {
    event.preventDefault();
    setMenuAbierto(false);
    const { error } = await cerrarSesion();
    if (error) {
      toast.error('No se pudo cerrar la sesión. Inténtalo de nuevo.');
      return;
    }
    toast.info('Has cerrado sesión.');
    navegar('/');
  };

  const alternarMenu = (event) => {
    event.preventDefault();
    setMenuAbierto((abierto) => !abierto);
  };

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <header className="fixed top-0 w-full z-50 border-b-2 border-surface-variant glass-header">
      <nav className="flex justify-between items-center gap-4 px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <Link
          to="/"
          onClick={cerrarMenu}
          className="flex items-center shrink-0"
          aria-label="Javi's, ir a inicio"
        >
          <img
            src={logoHorizontal}
            alt="Javi's"
            className="h-10 md:h-14 w-auto object-contain"
          />
        </Link>

        {/* Navegación de escritorio */}
        <div className="hidden lg:flex items-center gap-8 text-body-lg">
          {ENLACES.map((enlace) => (
            <NavLink key={enlace.a} to={enlace.a} className={claseEnlace}>
              {enlace.texto}
            </NavLink>
          ))}
          {estaAutenticado ? (
            <NavLink to="/mis-reservas" className={claseEnlace}>
              Mis reservas
            </NavLink>
          ) : null}
          {esAdmin ? (
            <NavLink to="/admin" className={claseEnlace}>
              Admin
            </NavLink>
          ) : null}
        </div>

        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {estaAutenticado ? (
            <>
              <Link
                to="/perfil"
                className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors max-w-[16rem]"
                title="Editar mi perfil"
              >
                <Icono nombre="usuario" className="w-5 h-5 shrink-0" />
                <span className="text-label-sm truncate">
                  {perfil?.nombre || 'Mi perfil'}
                </span>
              </Link>
              <button
                type="button"
                onClick={manejarCierreSesion}
                className="flex items-center gap-2 text-error hover:brightness-125 transition-all font-bold text-label-bold uppercase"
              >
                <Icono nombre="salir" className="w-5 h-5" />
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-on-surface-variant hover:text-primary transition-colors font-bold text-label-bold uppercase"
              >
                Entrar
              </Link>
              <Link to="/reservas" className="btn-primario">
                Reservar
              </Link>
            </>
          )}
        </div>

        {/* Botón de menú móvil */}
        <button
          type="button"
          onClick={alternarMenu}
          className="lg:hidden text-on-surface hover:text-primary transition-colors p-2"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
        >
          <Icono nombre={menuAbierto ? 'cerrar' : 'menu'} className="w-7 h-7" />
        </button>
      </nav>

      {/* Menú móvil desplegable */}
      {menuAbierto ? (
        <div className="lg:hidden border-t-2 border-surface-variant bg-surface animate-fade-in">
          <div className="flex flex-col px-margin-mobile py-6 gap-5">
            {ENLACES.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                onClick={cerrarMenu}
                className={claseEnlace}
              >
                {enlace.texto}
              </NavLink>
            ))}
            {estaAutenticado ? (
              <NavLink to="/mis-reservas" onClick={cerrarMenu} className={claseEnlace}>
                Mis reservas
              </NavLink>
            ) : null}
            {estaAutenticado ? (
              <NavLink to="/perfil" onClick={cerrarMenu} className={claseEnlace}>
                Mi perfil
              </NavLink>
            ) : null}
            {esAdmin ? (
              <NavLink to="/admin" onClick={cerrarMenu} className={claseEnlace}>
                Admin
              </NavLink>
            ) : null}

            <div className="pt-4 border-t border-surface-variant flex flex-col gap-3">
              {estaAutenticado ? (
                <button
                  type="button"
                  onClick={manejarCierreSesion}
                  className="btn-peligro w-full"
                >
                  Cerrar sesión
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={cerrarMenu}
                    className="btn-secundario text-center"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/registro"
                    onClick={cerrarMenu}
                    className="btn-primario text-center"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
