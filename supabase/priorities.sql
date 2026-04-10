-- Daily priorities table for Supabase (mirrors SQLite daily_priorities)
-- Used on Vercel where better-sqlite3 is unavailable.

create table if not exists public.daily_priorities (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  emoji text not null default '⚡',
  urgency text not null default 'normal' check (urgency in ('urgent', 'important', 'normal')),
  completed integer not null default 0,
  date text not null default to_char(now() at time zone 'UTC', 'YYYY-MM-DD'),
  created_at timestamptz not null default now()
);

create index if not exists idx_priorities_date on public.daily_priorities(date);
