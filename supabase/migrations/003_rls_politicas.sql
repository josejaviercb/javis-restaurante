-- =====================================================================
-- Snakko — Row Level Security
-- Regla general: la carta es pública en lectura; todo lo demás está
-- restringido al propio usuario o al rol administrador.
-- =====================================================================

alter table public.perfiles enable row level security;
alter table public.secciones enable row level security;
alter table public.platos enable row level security;
alter table public.franjas_horarias enable row level security;
alter table public.reservas enable row level security;

-- ---------------------------------------------------------------------
-- PERFILES
-- ---------------------------------------------------------------------
drop policy if exists "perfiles_select_propio_o_admin" on public.perfiles;
create policy "perfiles_select_propio_o_admin" on public.perfiles
  for select using (id = auth.uid() or public.es_admin());

drop policy if exists "perfiles_insert_propio" on public.perfiles;
create policy "perfiles_insert_propio" on public.perfiles
  for insert with check (id = auth.uid() or public.es_admin());

drop policy if exists "perfiles_update_propio_o_admin" on public.perfiles;
create policy "perfiles_update_propio_o_admin" on public.perfiles
  for update using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());

drop policy if exists "perfiles_delete_admin" on public.perfiles;
create policy "perfiles_delete_admin" on public.perfiles
  for delete using (public.es_admin());

-- ---------------------------------------------------------------------
-- SECCIONES — lectura pública, escritura solo administrador
-- ---------------------------------------------------------------------
drop policy if exists "secciones_select_publico" on public.secciones;
create policy "secciones_select_publico" on public.secciones
  for select using (true);

drop policy if exists "secciones_escritura_admin" on public.secciones;
create policy "secciones_escritura_admin" on public.secciones
  for all using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------------
-- PLATOS — lectura pública, escritura solo administrador
-- ---------------------------------------------------------------------
drop policy if exists "platos_select_publico" on public.platos;
create policy "platos_select_publico" on public.platos
  for select using (true);

drop policy if exists "platos_escritura_admin" on public.platos;
create policy "platos_escritura_admin" on public.platos
  for all using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------------
-- FRANJAS HORARIAS — lectura pública, escritura solo administrador
-- ---------------------------------------------------------------------
drop policy if exists "franjas_select_publico" on public.franjas_horarias;
create policy "franjas_select_publico" on public.franjas_horarias
  for select using (true);

drop policy if exists "franjas_escritura_admin" on public.franjas_horarias;
create policy "franjas_escritura_admin" on public.franjas_horarias
  for all using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------------
-- RESERVAS — cada cliente solo accede a las suyas
-- ---------------------------------------------------------------------
drop policy if exists "reservas_select_propias_o_admin" on public.reservas;
create policy "reservas_select_propias_o_admin" on public.reservas
  for select using (usuario_id = auth.uid() or public.es_admin());

drop policy if exists "reservas_insert_propias_o_admin" on public.reservas;
create policy "reservas_insert_propias_o_admin" on public.reservas
  for insert with check (usuario_id = auth.uid() or public.es_admin());

drop policy if exists "reservas_update_propias_o_admin" on public.reservas;
create policy "reservas_update_propias_o_admin" on public.reservas
  for update using (usuario_id = auth.uid() or public.es_admin())
  with check (usuario_id = auth.uid() or public.es_admin());

drop policy if exists "reservas_delete_propias_o_admin" on public.reservas;
create policy "reservas_delete_propias_o_admin" on public.reservas
  for delete using (usuario_id = auth.uid() or public.es_admin());

-- ---------------------------------------------------------------------
-- STORAGE — bucket público 'platos' para las imágenes
--
-- IMPORTANTE: en muchos proyectos de Supabase este INSERT no basta para
-- crear el bucket (la tabla storage.buckets está protegida y el bucket
-- debe registrarse a través de la API de Storage). Si tras ejecutar este
-- script el bucket no aparece en el panel, créalo a mano:
--   Storage > New bucket > nombre "platos" > marcar "Public bucket".
-- Las políticas de abajo funcionan igual en ambos casos.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('platos', 'platos', true)
on conflict (id) do nothing;

drop policy if exists "platos_imagenes_lectura_publica" on storage.objects;
create policy "platos_imagenes_lectura_publica" on storage.objects
  for select using (bucket_id = 'platos');

drop policy if exists "platos_imagenes_insert_admin" on storage.objects;
create policy "platos_imagenes_insert_admin" on storage.objects
  for insert with check (bucket_id = 'platos' and public.es_admin());

drop policy if exists "platos_imagenes_update_admin" on storage.objects;
create policy "platos_imagenes_update_admin" on storage.objects
  for update using (bucket_id = 'platos' and public.es_admin());

drop policy if exists "platos_imagenes_delete_admin" on storage.objects;
create policy "platos_imagenes_delete_admin" on storage.objects
  for delete using (bucket_id = 'platos' and public.es_admin());
