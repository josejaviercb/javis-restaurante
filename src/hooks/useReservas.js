import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Reservas del usuario que ha iniciado sesión.
 * Las políticas RLS ya limitan el resultado a las suyas.
 */
export function useMisReservas(usuarioId) {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!usuarioId) {
      setReservas([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false })
      .order('franja', { ascending: false });

    if (error) {
      console.error('No se pudieron cargar las reservas:', error.message);
      setReservas([]);
    } else {
      setReservas(data ?? []);
    }
    setCargando(false);
  }, [usuarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { reservas, cargando, recargar: cargar };
}

/**
 * Todas las reservas con los datos del cliente. Solo para administradores.
 */
export function useTodasLasReservas() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('reservas')
      .select('*, cliente:perfiles(id, nombre, telefono)')
      .order('fecha', { ascending: false })
      .order('franja', { ascending: true });

    if (error) {
      console.error('No se pudieron cargar las reservas:', error.message);
      setReservas([]);
    } else {
      setReservas(data ?? []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { reservas, cargando, recargar: cargar };
}

/**
 * Disponibilidad por franja para una fecha concreta.
 * Usa la función SQL disponibilidad_franja().
 */
export function useDisponibilidad(fechaISO) {
  const [franjas, setFranjas] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!fechaISO) {
      setFranjas([]);
      return;
    }

    setCargando(true);
    const { data, error } = await supabase.rpc('disponibilidad_franja', {
      p_fecha: fechaISO,
    });

    if (error) {
      console.error('No se pudo consultar la disponibilidad:', error.message);
      setFranjas([]);
    } else {
      setFranjas(data ?? []);
    }
    setCargando(false);
  }, [fechaISO]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { franjas, cargando, recargar: cargar };
}
