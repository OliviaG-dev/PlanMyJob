-- Statut par utilisateur et par site : compte créé, CV envoyé
create table if not exists public.user_job_site_status (
  user_id uuid not null references auth.users (id) on delete cascade,
  job_site_id uuid not null references public.job_sites (id) on delete cascade,
  account_created boolean not null default false,
  cv_sent boolean not null default false,
  primary key (user_id, job_site_id)
);

create index if not exists user_job_site_status_user_id_idx on public.user_job_site_status (user_id);

alter table public.user_job_site_status enable row level security;

-- L'utilisateur ne voit et ne modifie que ses propres lignes
drop policy if exists "user_job_site_status_select" on public.user_job_site_status;
create policy "user_job_site_status_select" on public.user_job_site_status
  for select using (auth.uid() = user_id);

drop policy if exists "user_job_site_status_insert" on public.user_job_site_status;
create policy "user_job_site_status_insert" on public.user_job_site_status
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_job_site_status_update" on public.user_job_site_status;
create policy "user_job_site_status_update" on public.user_job_site_status
  for update using (auth.uid() = user_id);

drop policy if exists "user_job_site_status_delete" on public.user_job_site_status;
create policy "user_job_site_status_delete" on public.user_job_site_status
  for delete using (auth.uid() = user_id);
