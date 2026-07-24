import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Icono from '../../components/ui/Icono';
import CampoPassword from '../../components/ui/CampoPassword';

export default function Registro() {
  const { registrar, estaAutenticado, cargando } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();

  const [datos, setDatos] = useState({
    nombre: '',
    telefono: '',
    email: '',
    password: '',
    repetirPassword: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');

  if (!cargando && estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  const actualizarCampo = (campo) => (event) => {
    setDatos((previos) => ({ ...previos, [campo]: event.target.value }));
  };

  const validar = () => {
    if (!datos.nombre.trim()) return 'Escribe tu nombre completo.';
    if (!datos.email.trim()) return 'Escribe tu email.';
    if (!datos.telefono.trim()) return 'Escribe tu teléfono de contacto.';
    // Se aceptan espacios, guiones y prefijo internacional; se comprueba
    // solo que haya al menos 7 dígitos reales.
    if (datos.telefono.replace(/\D/g, '').length < 7) {
      return 'El teléfono no parece válido. Incluye el prefijo, por ejemplo +593 991234567.';
    }
    if (datos.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (datos.password !== datos.repetirPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return '';
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    const mensajeError = validar();
    if (mensajeError) {
      setErrorFormulario(mensajeError);
      return;
    }
    setErrorFormulario('');
    setEnviando(true);

    const { data, error } = await registrar({
      email: datos.email.trim(),
      password: datos.password,
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
    });
    setEnviando(false);

    if (error) {
      const mensaje = error.message.includes('already registered')
        ? 'Ya existe una cuenta con ese email.'
        : 'No se pudo completar el registro. Inténtalo de nuevo.';
      setErrorFormulario(mensaje);
      return;
    }

    // Si el proyecto exige confirmar el email, no hay sesión todavía.
    if (!data.session) {
      toast.info('Revisa tu correo para confirmar la cuenta antes de entrar.');
      navegar('/login', { replace: true });
      return;
    }

    toast.exito('¡Cuenta creada! Ya puedes reservar mesa.');
    navegar('/reservas', { replace: true });
  };

  return (
    <section className="px-margin-mobile md:px-margin-desktop py-16 md:py-24">
      <div className="max-w-[40rem] mx-auto">
        <header className="mb-10 text-center">
          <span className="inline-flex w-16 h-16 rounded-xl bg-primary-container text-on-primary-container items-center justify-center mb-6">
            <Icono nombre="usuario" className="w-8 h-8" />
          </span>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-primary uppercase mb-3">
            Crear cuenta
          </h1>
          <p className="text-body-md text-tertiary">
            Únete al clan y reserva tu mesa en segundos.
          </p>
        </header>

        <form
          onSubmit={manejarEnvio}
          className="bg-surface-container-high brutalist-border rounded-2xl p-8 space-y-6"
          noValidate
        >
          <div>
            <label htmlFor="nombre" className="etiqueta-formulario">
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              className="campo-formulario"
              placeholder="Alex Martínez"
              value={datos.nombre}
              onChange={actualizarCampo('nombre')}
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="telefono" className="etiqueta-formulario">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              className="campo-formulario"
              placeholder="+593 991234567"
              value={datos.telefono}
              onChange={actualizarCampo('telefono')}
              autoComplete="tel"
              required
            />
          </div>

          <div>
            <label htmlFor="email-registro" className="etiqueta-formulario">
              Email
            </label>
            <input
              id="email-registro"
              type="email"
              className="campo-formulario"
              placeholder="tu@email.com"
              value={datos.email}
              onChange={actualizarCampo('email')}
              autoComplete="email"
              required
            />
          </div>

          <CampoPassword
            id="password-registro"
            etiqueta="Contraseña"
            placeholder="Mínimo 6 caracteres"
            valor={datos.password}
            onChange={actualizarCampo('password')}
            autoComplete="new-password"
            required
          />

          <CampoPassword
            id="repetir-password"
            etiqueta="Repetir contraseña"
            valor={datos.repetirPassword}
            onChange={actualizarCampo('repetirPassword')}
            autoComplete="new-password"
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
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <p className="text-center text-body-md text-tertiary">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
