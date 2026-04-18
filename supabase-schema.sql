-- ─── ESQUEMA SUPABASE — La Cocina del Rey ────────────────────────────────
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- Perfil de usuario (una sola fila, nombre = 'cabre')
create table if not exists perfil (
  nombre                      text primary key,
  xp                          integer not null default 0,
  racha_sin_monster           integer not null default 0,
  fecha_ultima_actualizacion  date
);
insert into perfil (nombre, xp, racha_sin_monster)
  values ('cabre', 0, 0)
  on conflict (nombre) do nothing;

-- Misiones diarias (una fila por día)
create table if not exists misiones_dia (
  fecha          date primary key,
  desayuno_hecho boolean not null default false,
  comida_hecha   boolean not null default false,
  cena_hecha     boolean not null default false,
  gym_hecho      boolean not null default false,
  limpieza_hecha boolean not null default false
);

-- Bebidas por día
create table if not exists bebidas_dia (
  fecha          date primary key,
  monsters       integer not null default 0,
  monsters_zero  integer not null default 0,
  cocacolas      integer not null default 0,
  cocacolas_zero integer not null default 0,
  copas          integer not null default 0
);

-- Gastos (múltiples filas por día, id autoincremental)
create table if not exists gastos (
  id          bigint generated always as identity primary key,
  fecha       date    not null default current_date,
  importe     numeric(8,2) not null,
  descripcion text    not null
);
create index if not exists gastos_fecha_idx on gastos (fecha desc);

-- Plan semanal (una fila por semana, clave = lunes de esa semana)
create table if not exists plan_semanal (
  semana text primary key,
  plan   jsonb not null default '{}'
);

-- Settings clave/valor (bmr, presupuesto, etc.)
create table if not exists settings (
  clave text primary key,
  valor text not null
);
insert into settings (clave, valor) values
  ('bmr',         '2000'),
  ('presupuesto', '150')
  on conflict (clave) do nothing;

-- Suscripciones push (para notificaciones PWA)
create table if not exists push_subscriptions (
  endpoint     text primary key,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);

-- ─── RLS — deshabilitar para app personal (solo tú accedes) ──────────────
alter table perfil              disable row level security;
alter table misiones_dia        disable row level security;
alter table bebidas_dia         disable row level security;
alter table gastos              disable row level security;
alter table plan_semanal        disable row level security;
alter table settings            disable row level security;
alter table push_subscriptions  disable row level security;
