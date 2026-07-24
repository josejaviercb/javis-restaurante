import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  // Evita actualizar el estado si el componente ya se desmontó.
  const montado = useRef(true);

  const cargarPerfil = useCallback(async (usuarioId) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', usuarioId)
      .maybeSingle();

    if (error) {
      console.error('No se pudo cargar el perfil:', error.message);
      return null;
    }
    return data;
  }, []);

  useEffect(() => {
    montado.current = true;

    const iniciar = async () => {
      const { data } = await supabase.auth.getSession();
      if (!montado.current) return;

      setSesion(data.session);
      if (data.session?.user) {
        const datosPerfil = await cargarPerfil(data.session.user.id);
        if (montado.current) setPerfil(datosPerfil);
      }
      if (montado.current) setCargando(false);
    };

    iniciar();

    const { data: subscripcion } = supabase.auth.onAuthStateChange(
      (evento, nuevaSesion) => {
        if (!montado.current) return;
        setSesion(nuevaSesion);

        if (!nuevaSesion?.user) {
          setPerfil(null);
          return;
        }

        // El callback de Supabase no admite trabajo asíncrono en su interior,
        // así que la carga del perfil se saca del hilo con setTimeout.
        window.setTimeout(async () => {
          const datosPerfil = await cargarPerfil(nuevaSesion.user.id);
          if (montado.current) setPerfil(datosPerfil);
        }, 0);
      }
    );

    return () => {
      montado.current = false;
      subscripcion.subscription.unsubscribe();
    };
  }, [cargarPerfil]);

  const registrar = useCallback(async ({ email, password, nombre, telefono }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // El trigger handle_new_user() lee estos metadatos para crear el perfil.
      options: { data: { nombre, telefono } },
    });
    return { data, error };
  }, []);

  const iniciarSesion = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const cerrarSesion = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setPerfil(null);
      setSesion(null);
    }
    return { error };
  }, []);

  const refrescarPerfil = useCallback(async () => {
    if (!sesion?.user) return;
    const datosPerfil = await cargarPerfil(sesion.user.id);
    if (montado.current) setPerfil(datosPerfil);
  }, [sesion, cargarPerfil]);

  const valor = useMemo(
    () => ({
      sesion,
      usuario: sesion?.user ?? null,
      perfil,
      cargando,
      estaAutenticado: Boolean(sesion?.user),
      esAdmin: perfil?.rol === 'administrador',
      registrar,
      iniciarSesion,
      cerrarSesion,
      refrescarPerfil,
    }),
    [sesion, perfil, cargando, registrar, iniciarSesion, cerrarSesion, refrescarPerfil]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return contexto;
}
