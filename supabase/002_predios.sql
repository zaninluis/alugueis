-- Migração: prédios e apartamentos cadastráveis.
-- Rode no SQL Editor do Supabase. Recria a tabela de reservas (estava vazia).

create table if not exists public.predios (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (length(trim(nome)) > 0),
  ordem      smallint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.apartamentos (
  id         uuid primary key default gen_random_uuid(),
  predio_id  uuid not null references public.predios (id) on delete cascade,
  nome       text not null check (length(trim(nome)) > 0),
  ordem      smallint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists apartamentos_predio_id_idx on public.apartamentos (predio_id);

drop table if exists public.reservas;
create table public.reservas (
  id              uuid primary key default gen_random_uuid(),
  apartamento_id  uuid not null references public.apartamentos (id) on delete restrict,
  guest           text not null check (length(trim(guest)) > 0),
  people          smallint not null check (people between 1 and 30),
  check_in        date not null,
  check_out       date not null check (check_out > check_in),
  phone           text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index reservas_apartamento_check_in_idx on public.reservas (apartamento_id, check_in);

-- impede duas reservas no mesmo apartamento com datas sobrepostas
create extension if not exists btree_gist;
alter table public.reservas
  add constraint reservas_sem_sobreposicao
  exclude using gist (apartamento_id with =, daterange(check_in, check_out, '[)') with &&);

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger reservas_updated_at before update on public.reservas
  for each row execute function public.set_updated_at();

-- Sem login: acesso total pela chave anon.
alter table public.predios enable row level security;
alter table public.apartamentos enable row level security;
alter table public.reservas enable row level security;
create policy predios_anon_all on public.predios for all to anon using (true) with check (true);
create policy apartamentos_anon_all on public.apartamentos for all to anon using (true) with check (true);
create policy reservas_anon_all on public.reservas for all to anon using (true) with check (true);

-- tempo real nas três tabelas
alter publication supabase_realtime add table public.predios;
alter publication supabase_realtime add table public.apartamentos;
alter publication supabase_realtime add table public.reservas;
