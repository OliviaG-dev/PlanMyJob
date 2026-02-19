-- Migration Supabase : sites d'emploi (Outils postulations)
-- À exécuter une fois dans le SQL Editor du dashboard Supabase (ou via supabase db push).
-- Table des sites d'emploi (liste partagée, modifiable par les utilisateurs connectés)
create table if not exists public.job_sites (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  position integer not null default 0
);

-- Index pour l'ordre d'affichage
create index if not exists job_sites_position_idx on public.job_sites (position);

-- RLS : lecture pour tout le monde (anon + authenticated), écriture pour les utilisateurs connectés
alter table public.job_sites enable row level security;

drop policy if exists "job_sites_select" on public.job_sites;
create policy "job_sites_select" on public.job_sites
  for select using (true);

drop policy if exists "job_sites_insert" on public.job_sites;
create policy "job_sites_insert" on public.job_sites
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "job_sites_update" on public.job_sites;
create policy "job_sites_update" on public.job_sites
  for update using (auth.role() = 'authenticated');

drop policy if exists "job_sites_delete" on public.job_sites;
create policy "job_sites_delete" on public.job_sites
  for delete using (auth.role() = 'authenticated');

-- Données initiales (optionnel)
insert into public.job_sites (label, url, position)
values
  ('LinkedIn', 'https://www.linkedin.com/jobs/', 0),
  ('HelloWork', 'https://www.hellowork.com/', 1),
  ('Indeed', 'https://www.indeed.fr/', 2),
  ('Welcome to the Jungle', 'https://www.welcometothejungle.com/fr', 3),
  ('France Travail', 'https://www.francetravail.fr/', 4)
;
