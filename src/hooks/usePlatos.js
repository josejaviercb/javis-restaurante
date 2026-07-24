import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Carga los platos junto con su sección.
 * @param {object} opciones
 * @param {boolean} opciones.soloDisponibles - filtra los platos no disponibles.
 * @param {boolean} opciones.soloDestacados - solo los "platos estrella".
 */
export function usePlatos({ soloDisponibles = true, soloDestacados = false } = {}) {
  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    let consulta = supabase
      .from('platos')
      .select('*, seccion:secciones(id, nombre, slug)')
      .order('orden', { ascending: true });

    if (soloDisponibles) consulta = consulta.eq('disponible', true);
    if (soloDestacados) consulta = consulta.eq('destacado', true);

    const { data, error: errorConsulta } = await consulta;

    if (errorConsulta) {
      setError('No se pudo cargar la carta.');
      setPlatos([]);
    } else {
      setPlatos(data ?? []);
    }
    setCargando(false);
  }, [soloDisponibles, soloDestacados]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { platos, cargando, error, recargar: cargar };
}

export function useSecciones({ soloActivas = true } = {}) {
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    let consulta = supabase.from('secciones').select('*').order('orden');
    if (soloActivas) consulta = consulta.eq('activa', true);

    const { data, error } = await consulta;
    if (error) {
      console.error('No se pudieron cargar las secciones:', error.message);
      setSecciones([]);
    } else {
      setSecciones(data ?? []);
    }
    setCargando(false);
  }, [soloActivas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { secciones, cargando, recargar: cargar };
}
