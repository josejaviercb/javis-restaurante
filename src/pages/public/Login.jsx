import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Icono from '../../components/ui/Icono';
import CampoPassword from '../../components/ui/CampoPassword';

export default function Login() {
  const { iniciarSesion, estaAutenticado, cargando } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');

  // Si ya hay sesión, no tiene sentido mostrar el formulario.
  if (!cargando && estaAutenticado) {
    return <Navigate to={ubicacion.state?.desde ?? '/'} replace />;
  }

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setErrorFormulario('');

    if (!email.trim() || !password) {
      setErrorFormulario('Introduce tu email y tu contraseña.');
      return;
    }

    setEnviando(true);
    const { error } = await iniciarSesion({ email: email.trim(), password });
    setEnviando(false);

    if (error) {
      const mensaje =
        error.message === 'Invalid login credentials'
          ? 'El email o la contraseña no son correctos.'
          : 'No se pudo iniciar sesión. Inténtalo de nuevo.';
      setErrorFormulario(mensaje);
      return;
    }

    toast.exito('¡Bienvenido de nuevo!');
    navegar(ubicacion.state?.desde ?? '/', { replace: true });
  };

  return (
    <section className="px-margin-mobile md:px-margin-desktop py-16 md:py-24">
      <div className="max-w-[40rem] mx-auto">
        <header className="mb-10 text-center">
          <span className="inline-flex w-16 h-16 rounded-xl bg-primary-container text-on-primary-container items-center justify-center mb-6">
            <Icono nombre="candado" className="w-8 h-8" />
          </span>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-primary uppercase mb-3">
            Iniciar sesión
          </h1>
          <p className="text-body-md text-tertiary">
            Entra para reservar mesa y gestionar tus reservas.
          </p>
        </header>

        <form
          onSubmit={manejarEnvio}
          className="bg-surface-container-high brutalist-border rounded-2xl p-8 space-y-6"
          noValidate
        >
          <div>
            <label htmlFor="email" className="etiqueta-formulario">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="campo-formulario"
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <CampoPassword
            id="password"
            etiqueta="Contraseña"
            valor={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {errorFormulario ? (
            <p
              className="flex items-center gap-2 text-error text-body-md bg-error-container/30 border border-error/40 rounded-lg px-4 py-3"
              role="alert"
            >
              <Icono nombre="aviso" className="w-5 h-5 shrink-0" />
              {errorFormulario}
            </p>
          ) : null}

          <button type="submit" className="btn-primario w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="text-center text-body-md text-tertiary">
            ¿Todavía no tienes cuenta?{' '}
            <Link to="/registro" className="text-primary font-bold hover:underline">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
