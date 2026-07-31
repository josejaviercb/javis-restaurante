-- =====================================================================
-- Snakko — Privilegios de tabla (GRANT)
--
-- Postgres exige DOS capas de permisos y hacen falta ambas:
--   1. GRANT  -> decide si el rol puede tocar la tabla siquiera.
--   2. RLS    -> decide QUÉ FILAS puede ver o modificar dentro de ella.
--
-- Las políticas RLS ya están definidas en 003_rls_politicas.sql, pero sin
-- estos GRANT el rol 'anon' recibe "permission denied for table" y la
-- carta pública no carga. Los GRANT abren la puerta; RLS sigue mandando
-- sobre las filas, así que esto no afloja la seguridad.
-- =====================================================================

-- Acceso al esquema.
grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------
-- LECTURA PÚBLICA (visitantes sin registrar)
-- La carta y los horarios se ven sin iniciar sesión.
-- ---------------------------------------------------------------------
grant select on public.secciones to anon, authenticated;
grant select on public.platos to anon, authenticated;
grant select on public.franjas_horarias to anon, authenticated;

-- ---------------------------------------------------------------------
-- ESCRITURA SOLO PARA USUARIOS AUTENTICADOS
-- Qué filas concretas puede tocar cada uno lo decide RLS:
--   - perfiles: el suyo (o todos, si es administrador)
--   - reservas: las suyas (o todas, si es administrador)
--   - secciones/platos: solo administradores
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.perfiles to authenticated;
grant select, insert, update, delete on public.reservas to authenticated;
grant insert, update, delete on public.secciones to authenticated;
grant insert, update, delete on public.platos to authenticated;
grant insert, update, delete on public.franjas_horarias to authenticated;

-- ---------------------------------------------------------------------
-- FUNCIONES
-- disponibilidad_franja se consulta desde la página de reservas.
-- ---------------------------------------------------------------------
grant execute on function public.disponibilidad_franja(date) to anon, authenticated;
grant execute on function public.es_admin() to anon, authenticated;
grant execute on function public.aforo_maximo() to anon, authenticated;
