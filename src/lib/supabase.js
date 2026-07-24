import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Se admiten los dos nombres de clave: el nuevo "publishable" y el clásico "anon".
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

// Aviso temprano y claro si faltan las credenciales, en vez de fallos opacos
// más adelante en cada consulta.
if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Faltan las variables de entorno de Supabase. ' +
      'Copia .env.example como .env.local y rellena VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
