-- Table candidatures : une ligne par candidature, liée à l'utilisateur connecté
create table if not exists public.candidatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entreprise text not null,
  poste text not null,
  lien_offre text,
  statut text not null check (statut in (
    'a_postuler', 'cv_envoye', 'entretien_rh', 'entretien_technique',
    'attente_reponse', 'refus', 'offre'
  )),
  statut_suivi text check (statut_suivi in ('en_cours', 'terminee')),
  date_candidature date,
  priorite text check (priorite in ('basse', 'normale', 'haute')),
  notes text,
  localisation text,
  type_contrat text check (type_contrat in ('cdi', 'cdd', 'alternance', 'stage', 'freelance', 'autre')),
  teletravail text check (teletravail in ('oui', 'non', 'hybride', 'inconnu')),
  source text check (source in ('linkedin', 'indeed', 'welcome_to_the_jungle', 'hellowork', 'site_entreprise', 'autre')),
  note_personnelle smallint check (note_personnelle >= 1 and note_personnelle <= 5),
  salaire_ou_fourchette text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour filtrer par user_id
create index if not exists idx_candidatures_user_id on public.candidatures (user_id);

-- Trigger pour mettre à jour updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists candidatures_updated_at on public.candidatures;
create trigger candidatures_updated_at
  before update on public.candidatures
  for each row execute function public.set_updated_at();

-- RLS : chaque utilisateur ne voit que ses candidatures
alter table public.candidatures enable row level security;

drop policy if exists "Users can read own candidatures" on public.candidatures;
create policy "Users can read own candidatures"
  on public.candidatures for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own candidatures" on public.candidatures;
create policy "Users can insert own candidatures"
  on public.candidatures for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own candidatures" on public.candidatures;
create policy "Users can update own candidatures"
  on public.candidatures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own candidatures" on public.candidatures;
create policy "Users can delete own candidatures"
  on public.candidatures for delete
  using (auth.uid() = user_id);
