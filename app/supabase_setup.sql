-- ============================================================================
-- AirSafe — Client directory table
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New query →
-- paste all of this → Run.
-- ============================================================================

create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  company_name    text not null,
  company_address text default '',
  contact_person  text default '',
  client_phone    text default '',
  client_email    text default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Fast case-insensitive lookups / dedupe by company name.
create index if not exists clients_company_name_lower_idx
  on public.clients (lower(company_name));

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- The web app uses the public "anon" key, so we must allow anon to read and
-- write THIS table (and only this table). No other data lives here — just
-- client contact details. Report content and photos never reach Supabase.
--
-- NOTE: with these policies, anyone who has your anon key (which ships in the
-- app) can read/insert/update client rows. That's normal for an internal tool.
-- If you later want to lock it down, add Supabase Auth and replace the
-- "using (true)" checks with "auth.role() = 'authenticated'".
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;

drop policy if exists "clients anon select" on public.clients;
create policy "clients anon select" on public.clients
  for select using (true);

drop policy if exists "clients anon insert" on public.clients;
create policy "clients anon insert" on public.clients
  for insert with check (true);

drop policy if exists "clients anon update" on public.clients;
create policy "clients anon update" on public.clients
  for update using (true) with check (true);
