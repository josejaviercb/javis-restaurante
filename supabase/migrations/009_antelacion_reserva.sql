-- =====================================================================
-- Javi's — Antelación mínima de reserva
-- Las reservas para hoy deben hacerse con al menos 45 minutos de
-- antelación. La hora se evalúa en la zona horaria del restaurante
-- (America/Lima, UTC-5) sobre el reloj del servidor, de modo que la
-- regla no dependa del navegador del cliente.
-- =====================================================================

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
