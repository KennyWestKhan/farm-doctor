-- Farm Doctor — impact / usage tables.
-- Run in the Supabase SQL editor. Contains NO personal data: reports are
-- anonymized diagnosis metadata (crop, disease, region, confidence), and the
-- user count is exposed as a single number via a function, without opening the
-- protected auth schema to the client.

-- Synced diagnosis reports (one per diagnosis a farmer runs). `id` is the
-- client-generated id (text, to accept legacy non-UUID ids from old builds).
create table if not exists public.reports (
  id          text primary key,
  user_id     text,            -- opaque auth/anon user id (no PII)
  crop_id     text,
  region      text,
  disease_id  text,
  confidence  real,
  status      text,            -- confident | uncertain | no_match
  had_photo   boolean,
  source      text,            -- offline | scan | vision
  created_at  timestamptz not null default now(),
  synced_at   timestamptz not null default now()
);

alter table public.reports enable row level security;
-- Rows are anonymized diagnosis metadata; the dashboard reads aggregates from
-- them. Writes go through the backend service role (which bypasses RLS).
drop policy if exists "public read reports" on public.reports;
create policy "public read reports" on public.reports for select using (true);

create index if not exists reports_created_at_idx on public.reports (created_at);
create index if not exists reports_region_idx on public.reports (region);

-- Real signup count for the impact dashboard, without exposing the protected
-- auth schema. SECURITY DEFINER so the anon client can call it; returns only a
-- single integer, never any user rows.
create or replace function public.app_user_count()
returns integer
language sql
security definer
set search_path = ''
as $$
  select count(*)::int from auth.users;
$$;

grant execute on function public.app_user_count() to anon, authenticated;
