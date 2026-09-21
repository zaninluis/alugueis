-- Rode este arquivo no SQL Editor do Supabase (Dashboard > SQL Editor > New query > Run).

create table if not exists public.reservas (
  id         uuid primary key default gen_random_uuid(),
  apt        smallint not null check (apt between 1 and 12),
  guest      text not null check (length(trim(guest)) > 0),
  people     smallint not null check (people between 1 and 30),
  check_in   date not null,
  check_out  date not null check (check_out > check_in),
  phone      text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- consultas por apartamento/período
create index if not exists reservas_apt_check_in_idx on public.reservas (apt, check_in);

-- impede duas reservas no mesmo apartamento com datas sobrepostas (mesmo que a UI falhe)
create extension if not exists btree_gist;
alter table public.reservas
  add constraint reservas_sem_sobreposicao
  exclude using gist (apt with =, daterange(check_in, check_out, '[)') with &&);

-- updated_at automático
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists reservas_updated_at on public.reservas;
create trigger reservas_updated_at before update on public.reservas
  for each row execute function public.set_updated_at();

-- Sem login: qualquer pessoa com o link do app (chave anon) pode ler e editar.
-- Se um dia quiser proteger, troque estas policies por regras com auth.uid().
alter table public.reservas enable row level security;
drop policy if exists reservas_anon_all on public.reservas;
create policy reservas_anon_all on public.reservas
  for all to anon using (true) with check (true);

-- tempo real: o app recebe mudanças de outros dispositivos na hora
alter publication supabase_realtime add table public.reservas;
