-- =====================================================================
-- Javi's — Actualización: franjas horarias + antelación mínima
-- Ejecutar en Supabase (SQL Editor). Es seguro ejecutarlo varias veces.
--
-- Qué hace:
--   1) Reemplaza las franjas horarias por el horario continuo 16:00–23:30.
--   2) Añade la validación de 45 min de antelación en el servidor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) FRANJAS HORARIAS: 16:00 a 23:30, cada media hora.
--    Se borran las que ya no forman parte del nuevo horario. No se
--    borran las que tengan reservas asociadas para no romper el historial;
--    si alguna antigua tuviera reservas, se desactiva en vez de borrarse.
-- ---------------------------------------------------------------------

-- Desactiva cualquier franja antigua que tenga reservas (no se puede borrar).
update public.franjas_horarias f
set activa = false
where f.hora not in (
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30',
  '20:00','20:30','21:00','21:30','22:00','22:30','23:00','23:30'
)
and exists (select 1 from public.reservas r where r.franja = f.hora);

-- Borra las franjas antiguas que NO tienen reservas asociadas.
delete from public.franjas_horarias f
where f.hora not in (
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30',
  '20:00','20:30','21:00','21:30','22:00','22:30','23:00','23:30'
)
and not exists (select 1 from public.reservas r where r.franja = f.hora);

-- Inserta el nuevo horario (idempotente por la clave única de 'hora').
insert into public.franjas_horarias (hora, turno, activa) values
  ('16:00', 'comida', true),
  ('16:30', 'comida', true),
  ('17:00', 'cena', true),
  ('17:30', 'cena', true),
  ('18:00', 'cena', true),
  ('18:30', 'cena', true),
  ('19:00', 'cena', true),
  ('19:30', 'cena', true),
  ('20:00', 'cena', true),
  ('20:30', 'cena', true),
  ('21:00', 'cena', true),
  ('21:30', 'cena', true),
  ('22:00', 'cena', true),
  ('22:30', 'cena', true),
  ('23:00', 'cena', true),
  ('23:30', 'cena', true)
on conflict (hora) do update set activa = true;

-- ---------------------------------------------------------------------
-- 2) VALIDACIÓN DE ANTELACIÓN MÍNIMA (45 min) en el trigger de reservas.
--    Zona horaria del restaurante: America/Lima (UTC-5).
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
