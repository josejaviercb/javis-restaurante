-- =====================================================================
-- Snakko — Esquema inicial
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
