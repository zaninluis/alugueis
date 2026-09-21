-- Quem fez a reserva (ex: "Lu", "Pai", "Mãe").
alter table public.reservas add column if not exists reservado_por text;
