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
