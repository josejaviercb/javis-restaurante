-- =====================================================================
-- Smash Bros Burger — Script completo de instalación
-- Pega este fichero entero en el SQL Editor de Supabase y ejecútalo.
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- =====================================================================

-- =====================================================================
-- Smash Bros Burger — Esquema inicial
-- Tablas: perfiles, secciones, platos, franjas_horarias, reservas
-- =====================================================================

-- ---------------------------------------------------------------------
-- PERFILES (extiende auth.users con nombre, teléfono y rol)
-- ---------------------------------------------------------------------
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  telefono text default '',
  rol text not null default 'cliente' check (rol in ('cliente', 'administrador')),
  creado_en timestamptz not null default now()
);

comment on table public.perfiles is 'Datos de perfil y rol de cada usuario registrado.';

-- ---------------------------------------------------------------------
-- SECCIONES DE LA CARTA
-- ---------------------------------------------------------------------
create table if not exists public.secciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  orden integer not null default 0,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

comment on table public.secciones is 'Secciones de la carta: Entradas, Hamburguesas, Pollo Broster, Papas Fritas, Postres, Bebidas.';

-- ---------------------------------------------------------------------
-- PLATOS
-- ---------------------------------------------------------------------
create table if not exists public.platos (
  id uuid primary key default gen_random_uuid(),
  seccion_id uuid not null references public.secciones (id) on delete restrict,
  nombre text not null,
  descripcion text not null default '',
  precio numeric(10, 2) not null check (precio >= 0),
  imagen_url text,
  etiqueta text,
  disponible boolean not null default true,
  destacado boolean not null default false,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create index if not exists idx_platos_seccion on public.platos (seccion_id);

comment on column public.platos.etiqueta is 'Distintivo opcional: Popular, Best Seller, Picante, Vegano...';
comment on column public.platos.destacado is 'Si aparece en la sección "Platos Estrella" de la portada.';

-- ---------------------------------------------------------------------
-- FRANJAS HORARIAS
-- ---------------------------------------------------------------------
create table if not exists public.franjas_horarias (
  id uuid primary key default gen_random_uuid(),
  hora time not null unique,
  turno text not null check (turno in ('comida', 'cena')),
  activa boolean not null default true
);

comment on table public.franjas_horarias is 'Horas concretas en las que se puede reservar mesa.';

-- ---------------------------------------------------------------------
-- RESERVAS
-- ---------------------------------------------------------------------
create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  fecha date not null,
  franja time not null,
  personas integer not null check (personas between 1 and 8),
  nombre_contacto text not null,
  telefono_contacto text not null default '',
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmada', 'cancelada')),
  notas text default '',
  creado_en timestamptz not null default now()
);

-- Índice clave para el cálculo de aforo por fecha y franja.
create index if not exists idx_reservas_fecha_franja on public.reservas (fecha, franja);
create index if not exists idx_reservas_usuario on public.reservas (usuario_id);

comment on table public.reservas is 'Reservas de mesa. El aforo por franja se valida con un trigger.';


-- =====================================================================
-- Smash Bros Burger — Funciones y triggers
-- Aforo, disponibilidad, creación automática de perfil y helper de rol.
-- =====================================================================

-- Aforo máximo de comensales por franja horaria.
create or replace function public.aforo_maximo()
returns integer
language sql
immutable
as $$
  select 40;
$$;

-- ---------------------------------------------------------------------
-- Crear el perfil automáticamente al registrarse un usuario.
-- El nombre y el teléfono llegan en raw_user_meta_data desde signUp().
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'telefono', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Helper de rol. SECURITY DEFINER para poder leer 'perfiles' desde las
-- políticas RLS de la propia tabla sin provocar recursión infinita.
-- ---------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'administrador'
  );
$$;

-- ---------------------------------------------------------------------
-- Disponibilidad de todas las franjas para una fecha dada.
-- Devuelve plazas ocupadas y libres sobre el aforo máximo.
-- ---------------------------------------------------------------------
create or replace function public.disponibilidad_franja(p_fecha date)
returns table (
  hora time,
  turno text,
  ocupadas integer,
  libres integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.hora,
    f.turno,
    coalesce(r.total, 0)::integer as ocupadas,
    (public.aforo_maximo() - coalesce(r.total, 0))::integer as libres
  from public.franjas_horarias f
  left join (
    select franja, sum(personas) as total
    from public.reservas
    where fecha = p_fecha and estado <> 'cancelada'
    group by franja
  ) r on r.franja = f.hora
  where f.activa = true
  order by f.hora;
$$;

-- ---------------------------------------------------------------------
-- Validación de aforo. Se ejecuta en el servidor para evitar que dos
-- reservas simultáneas superen juntas el límite (condición de carrera).
-- ---------------------------------------------------------------------
create or replace function public.validar_aforo_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ocupadas integer;
  v_maximo integer := public.aforo_maximo();
  v_antelacion_minima interval := interval '45 minutes';
  v_zona text := 'America/Lima';
  v_ahora_local timestamp := (now() at time zone v_zona);
  v_momento_reserva timestamp;
begin
  -- Una reserva cancelada nunca ocupa plazas.
  if new.estado = 'cancelada' then
    return new;
  end if;

  -- No se permite reservar en una fecha ya pasada.
  if new.fecha < current_date then
    raise exception 'No se puede reservar en una fecha pasada.'
      using errcode = 'check_violation';
  end if;

  -- Antelación mínima: se combina fecha + franja en un instante local y se
  -- compara con la hora actual del restaurante más el margen exigido.
  v_momento_reserva := (new.fecha + new.franja);
  if v_momento_reserva < v_ahora_local + v_antelacion_minima then
    raise exception
      'Las reservas requieren al menos 45 minutos de antelación. Elige una hora más tarde.'
      using errcode = 'check_violation';
  end if;

  -- La franja debe existir y estar activa.
  if not exists (
    select 1 from public.franjas_horarias
    where hora = new.franja and activa = true
  ) then
    raise exception 'La franja horaria seleccionada no está disponible.'
      using errcode = 'check_violation';
  end if;

  -- Suma de comensales ya reservados en esa fecha y franja,
  -- excluyendo la propia fila cuando se trata de una actualización.
  select coalesce(sum(personas), 0) into v_ocupadas
  from public.reservas
  where fecha = new.fecha
    and franja = new.franja
    and estado <> 'cancelada'
    and (tg_op = 'INSERT' or id <> new.id);

  if v_ocupadas + new.personas > v_maximo then
    raise exception
      'Aforo completo: quedan % plazas libres en esa franja y se han solicitado %.',
      v_maximo - v_ocupadas, new.personas
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_aforo on public.reservas;
create trigger trg_validar_aforo
  before insert or update on public.reservas
  for each row execute function public.validar_aforo_reserva();


-- =====================================================================
-- Smash Bros Burger — Row Level Security
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


-- =====================================================================
-- Smash Bros Burger — Privilegios de tabla (GRANT)
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


-- =====================================================================
-- Javi's — Datos iniciales
-- Secciones, franjas horarias y platos tomados de los mockups.
-- Es idempotente: se puede ejecutar varias veces sin duplicar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- SECCIONES
-- ---------------------------------------------------------------------
insert into public.secciones (nombre, slug, orden) values
  ('Entradas', 'entradas', 1),
  ('Hamburguesas', 'hamburguesas', 2),
  ('Pollo Broster', 'pollo-broster', 3),
  ('Papas Fritas', 'papas-fritas', 4),
  ('Postres', 'postres', 5),
  ('Bebidas', 'bebidas', 6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- FRANJAS HORARIAS
-- Horario continuo de 16:00 a 23:30, cada media hora. El campo 'turno'
-- se conserva por compatibilidad de esquema, pero la carta ya no agrupa
-- las franjas por turno.
-- ---------------------------------------------------------------------
insert into public.franjas_horarias (hora, turno) values
  ('16:00', 'comida'),
  ('16:30', 'comida'),
  ('17:00', 'cena'),
  ('17:30', 'cena'),
  ('18:00', 'cena'),
  ('18:30', 'cena'),
  ('19:00', 'cena'),
  ('19:30', 'cena'),
  ('20:00', 'cena'),
  ('20:30', 'cena'),
  ('21:00', 'cena'),
  ('21:30', 'cena'),
  ('22:00', 'cena'),
  ('22:30', 'cena'),
  ('23:00', 'cena'),
  ('23:30', 'cena')
on conflict (hora) do nothing;

-- ---------------------------------------------------------------------
-- PLATOS
-- Las imágenes son las de los mockups del diseño. Se pueden sustituir
-- desde el panel de administración subiendo ficheros propios.
-- ---------------------------------------------------------------------
insert into public.platos
  (seccion_id, nombre, descripcion, precio, etiqueta, destacado, orden, imagen_url)
select s.id, v.nombre, v.descripcion, v.precio, v.etiqueta, v.destacado, v.orden, v.imagen_url
from (values
  -- ---------------------------- ENTRADAS ----------------------------
  ('entradas', 'Nachos de la Casa',
   'Totopos de maíz crujientes con queso fundido, jalapeños, pico de gallo y guacamole.',
   7.50, 'Popular', false, 1,
   'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800&q=80'),

  ('entradas', 'Alitas BBQ',
   'Alitas de pollo glaseadas en salsa barbacoa, acompañadas de salsa ranch.',
   8.90, null, false, 2,
   'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800&q=80'),

  ('entradas', 'Aros de Cebolla',
   'Aros de cebolla rebozados y fritos, crujientes por fuera y tiernos por dentro.',
   5.50, null, false, 3,
   'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80'),

  -- -------------------------- HAMBURGUESAS --------------------------
  ('hamburguesas', 'Double OG Smash',
   '2 patties de 100g, doble queso americano, pepinillos, cebolla picada y mostaza en pan brioche artesano.',
   12.90, 'Best Seller', true, 1,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDV5_fa8chW8jyXAwdbUTkWK-OEt0R-S0_C9nxoEscOyyBCV1hUy-sgO4SeAetV0M7-BUnFTEumZJD_cDdDaX_AfU6S87OVh8zBFt_7iJ3YfBx_1K3PYTIaHRTMYfSOx_NN1Y4ESHj527WaRFR991gQNBO0lTgQVE-v5ZmKd2tAw5VzRMLDSdaqlYUj8Nt8B0a1aMlKHHAwvHRMZYrxaxddaVIquUTG2FG3OzEJMO2r14klxFLOPArDRarmFfXfaEkMa_7gZqRcRMdG'),

  ('hamburguesas', 'The Inferno Smash',
   'Tres carnes, jalapeños frescos, queso pepper jack y nuestra salsa picante Inferno. No apta para cobardes.',
   14.50, 'Picante', true, 2,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuB1daCMXAKtHYFI10YxIE7Mxcu_nmlcZiHzLLAE35O1ruLnI34chJkYg769GDDGbjIvNaiJn_AcgGeRwhSCrNwOV9GS4NyQTZe6F0Bi0QCDodZVH4XuXQEEikyngQFKmNOJEHQScaeHhHn-c2Que1VtSqUc3IPPDcPANBsYL5CYYxhEIMANKcHxZ-ebrk0TSxcYLrNz46uNI174Dtw5OOkiUNp9gFGCm1wQ4GDs9WlBtxXcnGzqXnGSfWKzqG4xJh3o1yszkxkjWRfV'),

  ('hamburguesas', 'Truffle King',
   'Carne Angus, crema de trufa negra, cebolla caramelizada y queso suizo.',
   16.00, null, true, 3,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuAwDRk_Lk6zeVkLXYSGAfoBqNJhsLaKmmyRypjVs6t0HN5WRG6z1yNSGknBYCO22-ViGxOIOn5yI7D1qn_LbVvM1yDNME9ht0FUZTsubUCSBA6VUkCeEwGGSqKjq1bhe38nrwHg82lT05sRjgP_Bz9x5UsbggNhOEZ8huE5SZCllmCqcI1Qvg8VjCUTg_fdAQ6WSItvISD2_QfteCbtQfKPj9G7hxbJWEfevgvnW7pMlwREOSd0UPGFa9rZp9_GEZhZFP_MXnsh_MkM'),

  ('hamburguesas', 'Green Power Smash',
   'Beyond Meat smashed, queso vegano, aguacate, brotes frescos y salsa alioli de soja.',
   13.20, 'Vegano', false, 4,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDIgSv-yXSGLBMkx_HYegey4u4PQi4d6w3X9KzfBHzPqQSVlKRkjpBuQqlb113CouCnjeXSgFMjgQS-yYKO9putVr6CgLpp62g4LK8ZrzgTK2W1HXu5QOEtvZLG9MDbVNWrJKhIoLmlL_wUe7ATRHLLCKwpzwUecfnK9tDxMSvfRvYbie99lSkM43uKh3lbHzzRB9swQN8tOtq3dofrziICdfpCkjpHeVOFx6JccmbW5TTu8K-iMEZWQ2WpOyTMokgOPOVPSkAPNZsl'),

  ('hamburguesas', 'Classic Smash',
   'Doble carne madurada, queso americano, cebolla, mostaza y pepinillos. La esencia.',
   12.00, null, false, 5,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuAHQLy2ZJl20M0pPlF_LtI1IqSVH4dYkArbgFeRS_S_WaBK-NLkJu_Kth0Q6Mb3LGCxNcLH8PEhND31P5VAHimIE6bArauek_q3-Qxxt84GKT6g6qc07wsgoKxAAMy5dgGjgi8oeovWT6MOuxgVerfOIMZq7nLpUaLo95MpbdDdQ_oPJhzJ6dSly6yhNNi8zRuzx6n8fcchRjC3RUCwIaZxHB9X1tGj9GbwzwWfnRj4zpeshd6uo_owyHNHrpo82WtvS3mHSDp1YwwW'),

  ('hamburguesas', 'Inferno Bros',
   'Triple smash, jalapeños frescos, salsa sriracha-mayo y bacon crujiente.',
   14.00, 'Picante', false, 6,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuAbZcfAzNLyAWO5CM13fLz53S0TNR4XJxSuiRlFKx9wGJ4Z0aQOGsv7IWy2uSjGBTS4Oba9TPyHAatj6h3BgLdhUjlgQefSFlL9fnxm32hN2a8NMDrTrhBg-c02eqi_9v2VoSJq0iY0yq--vATiK30XUMNT0BWclo0sEo5dtuUK84HW7Pqe6k0X9jeGoPjcOOPPGnaZMT1hbk6jznHsQ1je27tkjuQiKKIqdKcGk522OZfLyP6PLgfLAOXg148bCg5oikVHVgpDIXJh'),

  ('hamburguesas', 'The OG Smash',
   'Doble carne de 120g, queso cheddar y pepinillo encurtido de la casa.',
   12.50, null, false, 7,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDVvpW_gIVkqKiwNLAkU_N-zSifUp_ueYQshQij9CqHU4lswLkllPaRBG9NKLw-8AjjYZdJO-gh3N3FlmeacPFuqcAe9ZGgPwzyvJUP6A01OGqbltkfWrBdSoh1qu9jOiFGknBystVOC7V0idL_T1UdeNdfcov0ir_dcxyJEoGzIYeqhfeccx-2xp5bNceo9AOv4Vw_nK9HRgM-wHgXJyOjJXyfHLhhQ_c4aYkyK1o3z_KtwWnHSe8Ih2SPMb3QnZoWit2ECum-hHbs'),

  -- ------------------------- POLLO BROSTER ---------------------------
  ('pollo-broster', 'Broster Clásico',
   'Piezas de pollo marinadas 24 horas y fritas con nuestra receta de especias secretas, doradas y crujientes.',
   9.90, 'Best Seller', true, 1,
   'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80'),

  ('pollo-broster', 'Broster Picante',
   'Pollo broster bañado en salsa picante de la casa, con un toque ahumado.',
   10.50, 'Picante', true, 2,
   'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80'),

  ('pollo-broster', 'Combo Broster Familiar',
   '8 piezas de pollo broster para compartir, acompañadas de salsas de la casa.',
   22.00, null, false, 3,
   'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=800&q=80'),

  -- -------------------------- PAPAS FRITAS ---------------------------
  ('papas-fritas', 'Papas Clásicas',
   'Papas fritas caseras cortadas a mano, doradas y crujientes, con nuestro sazón de la casa.',
   4.50, 'Popular', true, 1,
   'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&q=80'),

  ('papas-fritas', 'Papas con Queso y Bacon',
   'Papas fritas cubiertas con queso fundido, bacon crujiente y cebollino.',
   6.90, null, false, 2,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuCjC-5-HGl-r02YYUujbIHxLK5CzXKeUj3XFppnwnqN4ts3kfzyr_vJ4BPojUN-cGzTfDE1dfVq3POeWHL8bSI0E4-Dr6Q-UvOn-n6ffRmB57rPIUHbP1Tpah_b1H-K5pVPQ7osDz-Vlkp4IR3p4-3ihxVihHQohtTBLWUGovxTUcwQLNIsWj1gGTpGpKSfCE3VVoTYx_DLWh4DGuQW8p3HHoPXTeYb_oFBiBd-7jvSGqkod7NbgTR4lydsJR6TqOd8LMWEH0i2lIEA'),

  ('papas-fritas', 'Papas Trufadas',
   'Papas caseras cortadas a mano, aceite de trufa y parmesano recién rallado.',
   6.90, null, false, 3,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuD6d_39szbHGA15f7-UB_Aiwlk65-RhAMmaP5KlwV1E5vIvHcxe1BY2m6TppNFb-6DM-6swn4PxmCXvSS6bj0yD0T2iFAgYyfFQXoDbksSikO1IXOcfd2PTNTHFcapLXBfMb17573mo2hi6RrpBsL-DBHgzrHue_lWDkkDSHdXBp5Z1kS8Tyx60nDwBYo2MtkY-O1rgv2fZEfdgBRsyFoDJ5B5WXQlwV2Pu3M5WblKaN2Vn2zWqDuOPYtvWlStdfHV8vJNlOvFCWJaZ'),

  ('papas-fritas', 'Papas Brutal',
   'Papas cortadas a mano, doble fritura y nuestro sazón secreto de la casa.',
   6.00, null, false, 4,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDQq5KrEbVRP7Efech8kM3mbF0ivzFDU1etCDv8JQ6JTYZu_l9Q57yiWLqPYiKy_A0okgZ1B_0I5XImN2toUQPQKS1-3OxqcegiJETWTlQK-ZJMVat0dEfEjGBKM2DyHYVAQKpdPEjSXL3I8BNI5Sm2Ti-F-uQB7XTUn02XugOuvXM9YouUS8kbVTMPPawO1ZDjt1q6XrTZO8FIMQgpgtBzn0uqrAPI2GVH9QsZ_LII6hXXwmP251otRjQG8k2WRMjT4CjI9g0tRy5b'),

  -- ---------------------------- POSTRES -----------------------------
  ('postres', 'Lava Smash Cake',
   'Coulant de chocolate negro 70% con corazón fundente, acompañado de helado de vainilla de Madagascar.',
   7.00, null, false, 1,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJu-GFsIDLqjNxqWmz6uI47o5-Jmj72Inymh_K-V98gNaZs1HzVtX5Qx7ZyJOEWJMenhZVEY2LCrMqjrjIm6JazJDsptnucGLgOpBO849593KruyU5NLfRcNiivs8wFS_3Vbhf6yuthX-MeiEQWBGbJHgrt09A14sYClHCDwnsB5Hp3_I5b3lHjLcW8IN1AeOnUu7b-Vb4GsgqaQP2zI_HDJXORw89to4sfceJUmqvRUfEPxVfLk0O37fA4UQ1RKfRdSzh0wxowo9'),

  ('postres', 'Nutella Blast',
   'Batido de avellana con nata montada y trozos de brownie.',
   5.50, null, false, 2,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuCmg-lfQkgVlQISrNUo0Nhu00lTTx7ye3luOATCz1BOE9YzcB9IFUjYwfmlFqpowYOZ2q8zY2DfwBz_cZtce0RiR_BXtgy6CeSdsBuQBjXzaprLAdhnlszkVd0sPZH8GoJxpFvZyEXDaU7jrdMmnjcZiLRzpzY3UUo0du_if26vPgMuoNZKqwZ-yxgMiQXwYRQ9iBNQVrQYuo5KQ7yj5RGqNyOPmHcGKlS19we49mIK35_Pr7iNurLMEs5lbs9S9bmrKCzJT_ZIn3V3'),

  -- ---------------------------- BEBIDAS -----------------------------
  ('bebidas', 'Craft Smash IPA',
   'Cerveza artesana local, notas cítricas y amargor equilibrado. Maridaje perfecto para toda la carta.',
   5.50, null, false, 1,
   'https://lh3.googleusercontent.com/aida-public/AB6AXuA5b6MZB2h_1KLzklhMcCI5uh4AwrB-WtFhEVXlzpdJVwgEGghVzDceTJtF2vDUplgsORzqljJmcDc02heBO8LRvLj1otHMf4TH3l2Oq3ZQ4-7u8pAPoVOW5O2fTy7fq6PoxFBy7D-opv4CDIJ45wdrEyDpo74yF7OEUwlvZwhxeJmNw3O8rIeE7mbUr5qdGP_NuMJok502egtQw3LEps8qyfFLwXeLzvu3RYIVXy4flK13TaGDDA3ltju6mThGSfiPXoh1FpONYKvS'),

  -- Estas dos bebidas no aparecían en los mockups: se usan fotos libres
  -- de Unsplash, sustituibles desde el panel de administración.
  ('bebidas', 'Limonada de la Casa',
   'Limonada natural con menta fresca y un toque de jengibre.',
   3.50, null, false, 2,
   'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80'),

  ('bebidas', 'Refresco Artesano',
   'Cola, naranja o limón de elaboración artesanal, sin colorantes.',
   3.00, null, false, 3,
   'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80')
) as v(slug_seccion, nombre, descripcion, precio, etiqueta, destacado, orden, imagen_url)
join public.secciones s on s.slug = v.slug_seccion
where not exists (
  select 1 from public.platos p where p.nombre = v.nombre
);


-- =====================================================================
-- Smash Bros Burger — Imágenes de las bebidas sin foto
--
-- 'Limonada de la Casa' y 'Refresco Artesano' se crearon sin imagen
-- porque los mockups del diseño no incluían fotos de bebidas sin
-- alcohol. Se asignan dos fotos libres de Unsplash (sin marcas
-- comerciales visibles) para que la carta no tenga huecos.
--
-- Ambas se pueden sustituir desde el panel de administración subiendo
-- las fotos reales del restaurante.
-- =====================================================================

update public.platos
set imagen_url = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80'
where nombre = 'Limonada de la Casa'
  and imagen_url is null;

update public.platos
set imagen_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80'
where nombre = 'Refresco Artesano'
  and imagen_url is null;


-- =====================================================================
-- Smash Bros Burger — Eliminación del límite de aforo
--
-- Se retira el tope de comensales por franja: las reservas ya no se
-- rechazan por capacidad y ninguna franja aparece como completa.
--
-- El trigger se mantiene con las validaciones que evitan datos
-- incoherentes:
--   - No se puede reservar en una fecha ya pasada.
--   - La franja horaria debe existir y estar activa.
-- =====================================================================

create or replace function public.validar_aforo_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Una reserva cancelada no necesita validación.
  if new.estado = 'cancelada' then
    return new;
  end if;

  -- No se permite reservar en una fecha ya pasada.
  if new.fecha < current_date then
    raise exception 'No se puede reservar en una fecha pasada.'
      using errcode = 'check_violation';
  end if;

  -- La franja debe existir y estar activa.
  if not exists (
    select 1 from public.franjas_horarias
    where hora = new.franja and activa = true
  ) then
    raise exception 'La franja horaria seleccionada no está disponible.'
      using errcode = 'check_violation';
  end if;

  -- Sin límite de aforo: no se comprueba la ocupación de la franja.
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- La función de disponibilidad pasa a ser informativa: sigue devolviendo
-- cuántos comensales hay reservados en cada franja, pero ya no calcula
-- plazas libres porque no hay máximo.
-- ---------------------------------------------------------------------
drop function if exists public.disponibilidad_franja(date);

create function public.disponibilidad_franja(p_fecha date)
returns table (
  hora time,
  turno text,
  ocupadas integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.hora,
    f.turno,
    coalesce(r.total, 0)::integer as ocupadas
  from public.franjas_horarias f
  left join (
    select franja, sum(personas) as total
    from public.reservas
    where fecha = p_fecha and estado <> 'cancelada'
    group by franja
  ) r on r.franja = f.hora
  where f.activa = true
  order by f.hora;
$$;

grant execute on function public.disponibilidad_franja(date) to anon, authenticated;

-- La función de aforo máximo ya no se usa.
drop function if exists public.aforo_maximo();


