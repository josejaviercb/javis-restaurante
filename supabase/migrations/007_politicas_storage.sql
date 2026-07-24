-- =====================================================================
-- Smash Bros Burger — Políticas del bucket 'platos'
--
-- Ejecutar SOLO si el bucket se ha recreado desde el panel y aparece
-- con 0 políticas. Al borrar un bucket se pierden sus políticas, y sin
-- ellas la API de Storage no lo expone (ni siquiera para listarlo).
--
-- Requisito previo: el bucket 'platos' debe existir y ser público
-- (Storage > New bucket > nombre "platos" > Public bucket).
-- =====================================================================

-- Cualquiera puede VER las imágenes de los platos: la carta es pública.
drop policy if exists "platos_imagenes_lectura_publica" on storage.objects;
create policy "platos_imagenes_lectura_publica" on storage.objects
  for select using (bucket_id = 'platos');

-- Solo los administradores pueden SUBIR imágenes.
drop policy if exists "platos_imagenes_insert_admin" on storage.objects;
create policy "platos_imagenes_insert_admin" on storage.objects
  for insert with check (bucket_id = 'platos' and public.es_admin());

-- Solo los administradores pueden REEMPLAZAR imágenes.
drop policy if exists "platos_imagenes_update_admin" on storage.objects;
create policy "platos_imagenes_update_admin" on storage.objects
  for update using (bucket_id = 'platos' and public.es_admin());

-- Solo los administradores pueden BORRAR imágenes.
drop policy if exists "platos_imagenes_delete_admin" on storage.objects;
create policy "platos_imagenes_delete_admin" on storage.objects
  for delete using (bucket_id = 'platos' and public.es_admin());
