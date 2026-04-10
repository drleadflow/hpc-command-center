-- Shadow tables for gradually moving Command Center off Airtable.
-- Airtable remains the default read source until CONTENT_DATA_PROVIDER
-- and OUTREACH_DATA_PROVIDER are explicitly switched to "supabase".

create table if not exists public.content_items (
  id text primary key,
  name text not null default '',
  title text not null default '',
  status text not null default '💡 Idea',
  content_type text not null default '',
  platforms text[] not null default '{}',
  post_time timestamptz null,
  hook text not null default '',
  copy text not null default '',
  script text not null default '',
  finished_video text null,
  raw_link text null,
  post_link text null,
  cta_link text null,
  views integer not null default 0,
  likes integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  comments integer not null default 0,
  engagement_rate numeric(8,2) not null default 0,
  month text not null default '',
  source text not null default 'airtable',
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_items_status on public.content_items(status);
create index if not exists idx_content_items_created_at on public.content_items(created_at desc);
create index if not exists idx_content_items_synced_at on public.content_items(synced_at desc);

create table if not exists public.outreach_campaigns (
  id text primary key,
  name text not null default '',
  client text not null default '',
  status text not null default '',
  channel text not null default '',
  owner text not null default '',
  leads_queued integer not null default 0,
  leads_contacted integer not null default 0,
  open_rate numeric(8,2) not null default 0,
  reply_rate numeric(8,2) not null default 0,
  positive_replies integer not null default 0,
  meetings_booked integer not null default 0,
  pipeline_value numeric(12,2) not null default 0,
  source text not null default 'airtable',
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_outreach_campaigns_status on public.outreach_campaigns(status);
create index if not exists idx_outreach_campaigns_client on public.outreach_campaigns(client);
create index if not exists idx_outreach_campaigns_synced_at on public.outreach_campaigns(synced_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
before update on public.content_items
for each row
execute function public.set_updated_at();

drop trigger if exists outreach_campaigns_set_updated_at on public.outreach_campaigns;
create trigger outreach_campaigns_set_updated_at
before update on public.outreach_campaigns
for each row
execute function public.set_updated_at();
