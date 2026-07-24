import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Icono from '../../components/ui/Icono';
import CampoPassword from '../../components/ui/CampoPassword';

export default function MiPerfil() {
  const { usuario, perfil, refrescarPerfil } = useAuth();
  const toast = useToast();

  // Datos de perfil y de cuenta. El email vive en auth.users, no en perfiles.
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repetirPassword, setRepetirPassword] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');

  // Precarga los datos actuales en cuanto están disponibles.
  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre || '');
      setTelefono(perfil.telefono || '');
    }
  }, [perfil]);

  useEffect(() => {
    if (usuario) {
      setEmail(usuario.email || '');
    }
  }, [usuario]);

  const validar = () => {
    if (!nombre.trim()) return 'Escribe tu nombre completo.';
    if (!email.trim()) return 'Escribe tu email.';
    if (!telefono.trim()) return 'Escribe tu teléfono de contacto.';
    if (telefono.replace(/\D/g, '').length < 7) {
      return 'El teléfono no parece válido. Incluye el prefijo, por ejemplo +593 991234567.';
    }
    // La contraseña es opcional: solo se valida si el usuario quiere cambiarla.
    if (password || repetirPassword) {
      if (password.length < 6) {
        return 'La nueva contraseña debe tener al menos 6 caracteres.';
      }
      if (password !== repetirPassword) {
        return 'Las contraseñas no coinciden.';
      }
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
    setGuardando(true);

    // 1) Actualiza nombre y teléfono en la tabla de perfiles.
    const { error: errorPerfil } = await supabase
      .from('perfiles')
      .update({ nombre: nombre.trim(), telefono: telefono.trim() })
      .eq('id', usuario.id);

    if (errorPerfil) {
      setGuardando(false);
      toast.error('No se pudieron guardar los datos del perfil. Inténtalo de nuevo.');
      return;
    }

    // 2) Email y/o contraseña se actualizan en la cuenta (auth.users).
    //    Solo se envían los que han cambiado, para no pedir reconfirmaciones
    //    innecesarias.
    const cambiosCuenta = {};
    if (email.trim() && email.trim() !== usuario.email) {
      cambiosCuenta.email = email.trim();
    }
    if (password) {
      cambiosCuenta.password = password;
    }

    let emailPendienteConfirmar = false;
    if (Object.keys(cambiosCuenta).length > 0) {
      const { error: errorCuenta } = await supabase.auth.updateUser(cambiosCuenta);
      if (errorCuenta) {
        setGuardando(false);
        // El perfil ya se guardó; se avisa de que la parte de cuenta falló.
        await refrescarPerfil();
        const mensaje = errorCuenta.message.includes('already registered')
          ? 'Ese email ya está en uso por otra cuenta.'
          : 'Los datos del perfil se guardaron, pero no se pudo actualizar el email o la contraseña.';
        toast.error(mensaje);
        return;
      }
      emailPendienteConfirmar = Boolean(cambiosCuenta.email);
    }

    await refrescarPerfil();
    setPassword('');
    setRepetirPassword('');
    setGuardando(false);

    if (emailPendienteConfirmar) {
      toast.info(
        'Perfil actualizado. Revisa tu nuevo correo para confirmar el cambio de email.',
      );
    } else {
      toast.exito('Perfil actualizado correctamente.');
    }
  };

  return (
    <section className="px-margin-mobile md:px-margin-desktop py-16 md:py-24">
      <div className="max-w-[48rem] mx-auto">
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 text-label-bold uppercase tracking-widest text-primary mb-4">
            <span className="w-8 h-px bg-primary" aria-hidden="true" />
            Mi cuenta
          </span>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface uppercase leading-none">
            Editar perfil
          </h1>
          <p className="text-body-md text-tertiary mt-3">
            Actualiza tus datos de contacto y acceso cuando lo necesites.
          </p>
        </header>

        <form
          onSubmit={manejarEnvio}
          className="bg-surface-container-high brutalist-border rounded-2xl p-8 space-y-8"
          noValidate
        >
          {/* Datos personales */}
          <fieldset className="space-y-6">
            <legend className="font-headline text-headline-md text-primary uppercase mb-2">
              Datos personales
            </legend>

            <div>
              <label htmlFor="perfil-nombre" className="etiqueta-formulario">
                Nombre completo
              </label>
              <input
                id="perfil-nombre"
                type="text"
                className="campo-formulario"
                placeholder="Alex Martínez"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="perfil-telefono" className="etiqueta-formulario">
                Teléfono
              </label>
              <input
                id="perfil-telefono"
                type="tel"
                className="campo-formulario"
                placeholder="+593 991234567"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                autoComplete="tel"
                required
              />
            </div>
          </fieldset>

          {/* Datos de acceso */}
          <fieldset className="space-y-6 pt-2 border-t border-on-surface/10">
            <legend className="font-headline text-headline-md text-primary uppercase mb-2 pt-6">
              Datos de acceso
            </legend>

            <div>
              <label htmlFor="perfil-email" className="etiqueta-formulario">
                Email
              </label>
              <input
                id="perfil-email"
                type="email"
                className="campo-formulario"
                placeholder="tu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
              <p className="text-label-sm text-tertiary mt-2">
                Si cambias el email, deberás confirmarlo desde el nuevo correo.
              </p>
            </div>

            <CampoPassword
              id="perfil-password"
              etiqueta="Nueva contraseña"
              placeholder="Déjalo vacío para no cambiarla"
              valor={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              ayuda="Mínimo 6 caracteres. Solo rellénalo si quieres cambiarla."
            />

            <CampoPassword
              id="perfil-repetir-password"
              etiqueta="Repetir nueva contraseña"
              placeholder="Repite la nueva contraseña"
              valor={repetirPassword}
              onChange={(event) => setRepetirPassword(event.target.value)}
              autoComplete="new-password"
            />
          </fieldset>

          {errorFormulario ? (
            <p
              className="flex items-center gap-2 text-error text-body-md bg-error-container/30 border border-error/40 rounded-lg px-4 py-3"
              role="alert"
            >
              <Icono nombre="aviso" className="w-5 h-5 shrink-0" />
              {errorFormulario}
            </p>
          ) : null}

          <button type="submit" className="btn-primario w-full" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </section>
  );
}
