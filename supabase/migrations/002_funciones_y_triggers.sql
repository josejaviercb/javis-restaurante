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
