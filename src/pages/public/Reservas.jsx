import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDisponibilidad } from '../../hooks/useReservas';
import Calendario from '../../components/reservas/Calendario';
import SelectorFranja from '../../components/reservas/SelectorFranja';
import Icono from '../../components/ui/Icono';
import {
  formatearFechaLarga,
  formatearHora,
  franjaTieneAntelacionSuficiente,
  ANTELACION_MINIMA_MINUTOS,
} from '../../lib/formato';
import combo from '../../assets/combo.png';

const OPCIONES_PERSONAS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Reservas() {
  const { usuario, perfil } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();

  const [fecha, setFecha] = useState('');
  const [personas, setPersonas] = useState(2);
  const [franja, setFranja] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { franjas, cargando: cargandoFranjas, recargar } = useDisponibilidad(fecha);

  // Precarga los datos de contacto en cuanto el perfil está disponible.
  useEffect(() => {
    if (perfil) {
      setNombre((actual) => actual || perfil.nombre || '');
      setTelefono((actual) => actual || perfil.telefono || '');
    }
  }, [perfil]);

  // Si cambia la fecha o el número de personas, la franja elegida puede
  // haber dejado de ser válida.
  useEffect(() => {
    setFranja('');
  }, [fecha, personas]);

  const seleccionarPersonas = (numero) => (event) => {
    event.preventDefault();
    setPersonas(numero);
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!fecha) {
      toast.error('Selecciona una fecha para tu reserva.');
      return;
    }
    if (!franja) {
      toast.error('Selecciona una franja horaria.');
      return;
    }
    // Comprobación de antelación mínima: puede haber caducado mientras el
    // usuario rellenaba el resto del formulario.
    if (!franjaTieneAntelacionSuficiente(fecha, franja)) {
      toast.error(
        `Las reservas requieren al menos ${ANTELACION_MINIMA_MINUTOS} minutos de antelación. Elige una hora más tarde.`,
      );
      setFranja('');
      recargar();
      return;
    }
    if (!nombre.trim()) {
      toast.error('Indica el nombre de contacto.');
      return;
    }
    // El restaurante necesita un teléfono para avisar de cualquier cambio.
    if (!telefono.trim()) {
      toast.error('Indica un teléfono de contacto.');
      return;
    }

    setEnviando(true);
    const { error } = await supabase.from('reservas').insert({
      usuario_id: usuario.id,
      fecha,
      franja,
      personas,
      nombre_contacto: nombre.trim(),
      telefono_contacto: telefono.trim(),
      notas: notas.trim(),
    });
    setEnviando(false);

    if (error) {
      // El trigger del servidor devuelve mensajes ya redactados para el
      // usuario (fecha pasada, franja no disponible, antelación mínima).
      const mensaje = error.message.includes('No se puede reservar')
        || error.message.includes('franja horaria')
        || error.message.includes('antelación')
        || error.message.includes('Aforo completo')
        ? error.message
        : 'No se pudo crear la reserva. Inténtalo de nuevo.';
      toast.error(mensaje);
      recargar();
      return;
    }

    toast.exito('¡Reserva creada! Te esperamos.');
    navegar('/mis-reservas');
  };

  return (
    <div>
      {/* Cabecera con imagen de fondo */}
      <header className="relative overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1600&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50"
          aria-hidden="true"
        />
        <div className="relative z-10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 text-label-bold uppercase tracking-widest text-primary mb-4">
                <span className="w-8 h-px bg-primary" aria-hidden="true" />
                Reservas
              </span>
              <h1 className="font-headline text-headline-lg-mobile md:text-headline-xl text-on-surface mb-4 uppercase leading-none">
                Reserva tu mesa
              </h1>
              <p className="text-body-lg text-on-surface/80 max-w-2xl">
                Asegura tu sitio en Javi's. Elige el momento perfecto para disfrutar de
                nuestras hamburguesas, pollo broster y papas fritas artesanales.
              </p>
            </div>
            <div className="hidden lg:flex lg:col-span-5 justify-end">
              <img
                src={combo}
                alt="Combo Javi's: hamburguesa, pollo broster y papas fritas"
                className="w-full max-w-md object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </header>

      <form
        onSubmit={manejarEnvio}
        className="px-margin-mobile md:px-margin-desktop pb-24 max-w-container-max mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 space-y-gutter">
            {/* Paso 1: fecha y personas */}
            <section className="bg-surface-container-high brutalist-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8">
                <Icono nombre="calendario" className="w-7 h-7 text-primary shrink-0" />
                <h2 className="font-headline text-headline-md text-on-surface uppercase">
                  1. Fecha y personas
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Calendario fechaSeleccionada={fecha} onSeleccionar={setFecha} />

                <div className="space-y-6">
                  <span className="etiqueta-formulario">Número de personas</span>
                  <div className="grid grid-cols-4 gap-3">
                    {OPCIONES_PERSONAS.map((numero) => (
                      <button
                        key={numero}
                        type="button"
                        onClick={seleccionarPersonas(numero)}
                        aria-pressed={personas === numero}
                        className={
                          personas === numero
                            ? 'py-4 bg-surface border border-primary text-primary font-bold rounded-xl shadow-md shadow-primary/20 transition-all'
                            : 'py-4 bg-surface border border-on-surface/15 hover:border-primary hover:text-primary rounded-xl transition-all'
                        }
                      >
                        {numero}
                      </button>
                    ))}
                  </div>
                  <p className="p-4 bg-surface border-l-4 border-primary text-label-sm text-tertiary">
                    Para reservas de más de 8 personas, contáctanos directamente por
                    teléfono.
                  </p>
                </div>
              </div>
            </section>

            {/* Paso 2: franja horaria */}
            <section className="bg-surface-container-high brutalist-border rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <Icono nombre="reloj" className="w-7 h-7 text-primary shrink-0" />
                <h2 className="font-headline text-headline-md text-on-surface uppercase">
                  2. Franja horaria
                </h2>
              </div>
              <p className="text-body-md text-tertiary mb-8">
                Las reservas deben realizarse con 45 minutos de anticipación.
              </p>

              <SelectorFranja
                franjas={franjas}
                fecha={fecha}
                cargando={cargandoFranjas}
                franjaSeleccionada={franja}
                onSeleccionar={setFranja}
              />
            </section>
          </div>

          {/* Resumen y confirmación */}
          <aside className="lg:col-span-4">
            <div className="bg-surface-container-highest border border-primary/60 rounded-2xl shadow-xl shadow-primary/10 overflow-hidden lg:sticky lg:top-28">
              <div className="p-6 md:p-8 space-y-6">
                <h2 className="font-headline text-headline-md text-primary uppercase">
                  Resumen
                </h2>

                <dl className="space-y-4 border-b border-surface-variant pb-6">
                  <div className="flex justify-between items-center gap-4">
                    <dt className="text-tertiary">Fecha:</dt>
                    <dd className="font-bold text-label-bold text-right">
                      {fecha ? formatearFechaLarga(fecha) : 'Sin elegir'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <dt className="text-tertiary">Hora:</dt>
                    <dd className="font-bold text-label-bold">
                      {franja ? formatearHora(franja) : 'Sin elegir'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <dt className="text-tertiary">Comensales:</dt>
                    <dd className="font-bold text-label-bold">
                      {personas} {personas === 1 ? 'persona' : 'personas'}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="nombre-contacto" className="etiqueta-formulario">
                      Nombre completo
                    </label>
                    <input
                      id="nombre-contacto"
                      type="text"
                      className="campo-formulario"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      placeholder="Alex Martínez"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="telefono-contacto" className="etiqueta-formulario">
                      Teléfono
                    </label>
                    <input
                      id="telefono-contacto"
                      type="tel"
                      className="campo-formulario"
                      value={telefono}
                      onChange={(event) => setTelefono(event.target.value)}
                      placeholder="+593 991234567"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="notas" className="etiqueta-formulario">
                      Notas (opcional)
                    </label>
                    <textarea
                      id="notas"
                      className="campo-formulario resize-none"
                      rows={3}
                      value={notas}
                      onChange={(event) => setNotas(event.target.value)}
                      placeholder="Alergias, trona para bebé, celebración…"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primario w-full"
                  disabled={enviando || !fecha || !franja}
                >
                  {enviando ? 'Confirmando…' : 'Confirmar reserva'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
