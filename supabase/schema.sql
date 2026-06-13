-- ============================================================
-- DPL Hub — Supabase schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- TEAMS ----------
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text default '🛡️',
  captain text,
  vice_captain text,
  created_at timestamptz default now()
);

-- ---------- PLAYERS ----------
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'DOBA' check (category in ('DOBA','Non-DOBA')),
  role text not null default 'Batsman' check (role in ('Batsman','Bowler','All-rounder','Wicket-keeper')),
  team text not null default 'Unassigned',
  matches int not null default 0,
  runs int not null default 0,
  wickets int not null default 0,
  highest_score int not null default 0,
  created_at timestamptz default now()
);

-- ---------- ANNOUNCEMENTS ----------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz default now()
);

-- ---------- FIXTURES ----------
create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  team_a text not null,
  team_b text not null,
  match_date timestamptz,
  venue text,
  round text,
  status text not null default 'upcoming' check (status in ('upcoming','live','completed','cancelled')),
  created_at timestamptz default now()
);

-- ---------- RESULTS ----------
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references fixtures(id) on delete cascade,
  winner text,
  summary text,
  score_a text,
  score_b text,
  created_at timestamptz default now()
);

-- ---------- LIVE MATCHES ----------
create table if not exists live_matches (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references fixtures(id) on delete cascade,
  batting_team text,
  bowling_team text,
  runs int not null default 0,
  wickets int not null default 0,
  overs numeric not null default 0,
  striker text,
  non_striker text,
  bowler text,
  extras int not null default 0,
  last_over text default '',
  status text not null default 'upcoming' check (status in ('upcoming','live','innings_break','completed')),
  updated_at timestamptz default now()
);

-- ---------- LIVE BATTING SCORECARD ----------
create table if not exists live_batting (
  id uuid primary key default gen_random_uuid(),
  live_match_id uuid references live_matches(id) on delete cascade,
  player_name text not null,
  runs int not null default 0,
  balls int not null default 0,
  fours int not null default 0,
  sixes int not null default 0,
  dismissal text not null default 'not out',
  order_no int not null default 0
);

-- ---------- LIVE BOWLING SCORECARD ----------
create table if not exists live_bowling (
  id uuid primary key default gen_random_uuid(),
  live_match_id uuid references live_matches(id) on delete cascade,
  player_name text not null,
  overs numeric not null default 0,
  maidens int not null default 0,
  runs int not null default 0,
  wickets int not null default 0,
  order_no int not null default 0
);

-- ============================================================
-- ROW LEVEL SECURITY
-- This app has no authentication (single shared admin panel).
-- Public read access for everyone, public write access for admin actions.
-- For production, consider gating writes behind a passcode or Supabase Auth.
-- ============================================================

alter table teams enable row level security;
alter table players enable row level security;
alter table announcements enable row level security;
alter table fixtures enable row level security;
alter table results enable row level security;
alter table live_matches enable row level security;
alter table live_batting enable row level security;
alter table live_bowling enable row level security;

create policy "public read teams" on teams for select using (true);
create policy "public write teams" on teams for all using (true) with check (true);

create policy "public read players" on players for select using (true);
create policy "public write players" on players for all using (true) with check (true);

create policy "public read announcements" on announcements for select using (true);
create policy "public write announcements" on announcements for all using (true) with check (true);

create policy "public read fixtures" on fixtures for select using (true);
create policy "public write fixtures" on fixtures for all using (true) with check (true);

create policy "public read results" on results for select using (true);
create policy "public write results" on results for all using (true) with check (true);

create policy "public read live_matches" on live_matches for select using (true);
create policy "public write live_matches" on live_matches for all using (true) with check (true);

create policy "public read live_batting" on live_batting for select using (true);
create policy "public write live_batting" on live_batting for all using (true) with check (true);

create policy "public read live_bowling" on live_bowling for select using (true);
create policy "public write live_bowling" on live_bowling for all using (true) with check (true);

-- ============================================================
-- REALTIME
-- Add all tables to the supabase_realtime publication so
-- postgres_changes subscriptions fire on every insert/update/delete.
-- ============================================================

alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table announcements;
alter publication supabase_realtime add table fixtures;
alter publication supabase_realtime add table results;
alter publication supabase_realtime add table live_matches;
alter publication supabase_realtime add table live_batting;
alter publication supabase_realtime add table live_bowling;

-- ============================================================
-- SEED DATA (optional — feel free to delete or edit)
-- ============================================================

insert into teams (name, emoji) values
  ('Falcons', '🦅'),
  ('Titans', '⚡'),
  ('Warriors', '🐯'),
  ('Kings', '👑')
on conflict (name) do nothing;

insert into announcements (title, content, pinned) values
  ('Welcome to DPL Hub', 'Live scores, fixtures, and results will appear here in real time. Stay tuned for the schedule.', true)
on conflict do nothing;
