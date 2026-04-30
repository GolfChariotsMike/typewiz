-- TypeWiz initial schema
-- Run in Supabase SQL editor on project: fbpdcwbzkcklaxvqtayd

-- Enable UUID extension (should already be enabled)
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- tw_profiles — one row per user, created on registration
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tw_profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  email                     text not null,
  display_name              text,
  plan                      text not null default 'free' check (plan in ('free', 'pro')),
  hotkey                    text not null default 'right_alt',
  transcriptions_this_month integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- tw_transcriptions — log of each dictation event
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tw_transcriptions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.tw_profiles(id) on delete cascade,
  text        text,
  duration_ms integer,
  source      text default 'local' check (source in ('local', 'api')),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- tw_subscriptions — Stripe subscription data
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tw_subscriptions (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.tw_profiles(id) on delete cascade,
  stripe_customer_id   text,
  stripe_subscription_id text,
  status               text default 'inactive' check (status in ('active', 'inactive', 'cancelled', 'past_due')),
  plan                 text default 'pro',
  current_period_start timestamptz,
  current_period_end   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- tw_waitlist — pre-launch email captures
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tw_waitlist (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null unique,
  source     text default 'landing',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.tw_profiles enable row level security;
alter table public.tw_transcriptions enable row level security;
alter table public.tw_subscriptions enable row level security;
alter table public.tw_waitlist enable row level security;

-- Profiles: users can read/write their own row only
create policy "tw_profiles: own row" on public.tw_profiles
  for all using (auth.uid() = id);

-- Transcriptions: users can read/insert their own
create policy "tw_transcriptions: own rows" on public.tw_transcriptions
  for all using (auth.uid() = user_id);

-- Subscriptions: users can read their own
create policy "tw_subscriptions: own rows" on public.tw_subscriptions
  for select using (auth.uid() = user_id);

-- Waitlist: anyone can insert, no reads
create policy "tw_waitlist: insert only" on public.tw_waitlist
  for insert with check (true);

-- ─────────────────────────────────────────────────────────────
-- Trigger: bump updated_at on tw_profiles
-- ─────────────────────────────────────────────────────────────
create or replace function public.tw_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tw_profiles_updated_at
  before update on public.tw_profiles
  for each row execute function public.tw_set_updated_at();

create trigger tw_subscriptions_updated_at
  before update on public.tw_subscriptions
  for each row execute function public.tw_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Function: increment transcription count (called from app)
-- ─────────────────────────────────────────────────────────────
create or replace function public.tw_increment_transcription_count(user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.tw_profiles
  set transcriptions_this_month = transcriptions_this_month + 1,
      updated_at = now()
  where id = user_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Function: reset monthly counts (run via pg_cron or Edge Function)
-- ─────────────────────────────────────────────────────────────
create or replace function public.tw_reset_monthly_counts()
returns void language plpgsql security definer as $$
begin
  update public.tw_profiles
  set transcriptions_this_month = 0,
      updated_at = now()
  where plan = 'free';
end;
$$;
