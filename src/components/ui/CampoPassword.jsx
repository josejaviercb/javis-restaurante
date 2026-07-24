import { useId, useState } from 'react';
import Icono from './Icono';

/**
 * Campo de contraseña con botón para mostrar u ocultar lo escrito.
 * El estado es propio de cada campo, así que en el registro se puede
 * revelar una contraseña sin revelar la otra.
 */
export default function CampoPassword({
  id,
  etiqueta,
  valor,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  required = false,
  ayuda,
}) {
  const [visible, setVisible] = useState(false);
  // useId evita colisiones si el componente se usa varias veces sin id.
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;

  const alternarVisibilidad = (event) => {
    event.preventDefault();
    setVisible((actual) => !actual);
  };

  return (
    <div>
      <label htmlFor={idCampo} className="etiqueta-formulario">
        {etiqueta}
      </label>

      <div className="relative">
        <input
          id={idCampo}
          // El navegador deja de ocultar el texto al cambiar a "text".
          type={visible ? 'text' : 'password'}
          className="campo-formulario pr-14"
          placeholder={placeholder}
          value={valor}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
        />

        <button
          type="button"
          onClick={alternarVisibilidad}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-tertiary hover:text-primary transition-colors rounded-lg"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          // Se excluye del orden de tabulación para no estorbar al
          // rellenar el formulario con el teclado.
          tabIndex={-1}
        >
          <Icono nombre={visible ? 'ojoTachado' : 'ojo'} className="w-5 h-5" />
        </button>
      </div>

      {ayuda ? (
        <p className="text-label-sm text-tertiary mt-2">{ayuda}</p>
      ) : null}
    </div>
  );
}
