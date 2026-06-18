-- ============================================================================
-- PADELPIT — Supabase schema
-- Kør i Supabase SQL editor (eller via `supabase db push`).
-- Privat app: backend (FastAPI) skriver med service-role og omgår RLS.
-- RLS-policies herunder gælder kun direkte klient-adgang (login/læsning).
-- ============================================================================

-- ---- enums ----
do $$ begin
  create type event_type as enum ('training', 'match', 'league');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rsvp_status as enum ('in', 'maybe', 'out');
exception when duplicate_object then null; end $$;

-- ---- spillere (spejler auth.users) ----
create table if not exists players (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null,
  email           text not null,
  rankedin_id          text unique,   -- offentlig R-streng, fx R000169277
  rankedin_numeric_id  int,           -- internt api-id (fx 582057), caches ved sync
  is_admin        boolean not null default false,
  ranking_points  int not null default 1000,
  wins            int not null default 0,
  losses          int not null default 0,
  created_at      timestamptz not null default now()
);

-- ---- invitationskoder (lukket signup) ----
create table if not exists invite_codes (
  code        text primary key,
  created_by  uuid references players(id),
  used_by     uuid references players(id),
  used_at     timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ---- events (træning, åbne kampe, ligakampe) ----
create table if not exists events (
  id                bigint generated always as identity primary key,
  type              event_type not null,
  title             text not null,
  starts_at         timestamptz not null,
  location          text,
  created_by        uuid references players(id),
  rankedin_event_id text,            -- sat hvis synkroniseret fra RankedIn
  created_at        timestamptz not null default now()
);
create index if not exists idx_events_starts_at on events(starts_at);

-- ---- tilmeldinger ----
create table if not exists rsvps (
  event_id   bigint references events(id) on delete cascade,
  player_id  uuid references players(id) on delete cascade,
  status     rsvp_status not null,
  updated_at timestamptz not null default now(),
  primary key (event_id, player_id)
);

-- ---- ligakampe (synkroniseret fra RankedIn) ----
create table if not exists league_fixtures (
  id                bigint generated always as identity primary key,
  rankedin_match_id text unique,
  opponent          text not null,
  starts_at         timestamptz,
  is_home           boolean,
  status            text not null default 'upcoming',   -- 'upcoming' | 'finished'
  our_score         int,
  their_score       int,
  won               boolean,
  synced_at         timestamptz not null default now()
);

-- ---- kontingent / faste udgifter ----
create table if not exists dues (
  id          bigint generated always as identity primary key,
  period      text not null,         -- fx '2026-06'
  description text,
  amount_ore  int not null,          -- beløb pr. spiller i øre
  mobilepay_link text,               -- valgfrit: MobilePay betalingslink/QR
  created_at  timestamptz not null default now()
);

create table if not exists due_payments (
  due_id        bigint references dues(id) on delete cascade,
  player_id     uuid references players(id) on delete cascade,
  paid          boolean not null default false,
  paid_at       timestamptz,
  mobilepay_ref text,
  primary key (due_id, player_id)
);

-- ---- sync-log (RankedIn) ----
create table if not exists sync_log (
  id      bigint generated always as identity primary key,
  source  text,
  status  text,                       -- 'ok' | 'error'
  detail  text,
  ran_at  timestamptz not null default now()
);

-- ============================================================================
-- RLS
-- ============================================================================
alter table players          enable row level security;
alter table events           enable row level security;
alter table rsvps            enable row level security;
alter table league_fixtures  enable row level security;
alter table dues             enable row level security;
alter table due_payments     enable row level security;

-- spillere: alle medlemmer kan se hinanden; man kan kun opdatere egen profil
drop policy if exists players_select on players;
create policy players_select on players for select to authenticated using (true);

drop policy if exists players_update_self on players;
create policy players_update_self on players for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- events + ligakampe + dues: læsbare for alle medlemmer (skrives via backend)
drop policy if exists events_select on events;
create policy events_select on events for select to authenticated using (true);

drop policy if exists fixtures_select on league_fixtures;
create policy fixtures_select on league_fixtures for select to authenticated using (true);

drop policy if exists dues_select on dues;
create policy dues_select on dues for select to authenticated using (true);

-- rsvps: alle kan se; man styrer kun sine egne
drop policy if exists rsvps_select on rsvps;
create policy rsvps_select on rsvps for select to authenticated using (true);

drop policy if exists rsvps_write_self on rsvps;
create policy rsvps_write_self on rsvps for all to authenticated
  using (player_id = auth.uid()) with check (player_id = auth.uid());

-- betalinger: alle kan se status; man opdaterer kun egen
drop policy if exists payments_select on due_payments;
create policy payments_select on due_payments for select to authenticated using (true);

drop policy if exists payments_write_self on due_payments;
create policy payments_write_self on due_payments for all to authenticated
  using (player_id = auth.uid()) with check (player_id = auth.uid());

-- ============================================================================
-- Seed: en enkelt invitationskode at teste med (slet i produktion)
-- ============================================================================
insert into invite_codes (code) values ('PIT-FIRST')
on conflict (code) do nothing;
