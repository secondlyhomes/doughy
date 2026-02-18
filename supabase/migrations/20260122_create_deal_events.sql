-- Deal Events table for timeline
-- Zone B: Task B1 - Database migration for deal timeline events

create table if not exists deal_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  metadata jsonb default '{}',
  source text not null default 'system' check (source in ('system', 'user', 'ai')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_deal_events_deal_id on deal_events(deal_id);
create index if not exists idx_deal_events_created_at on deal_events(created_at desc);
create index if not exists idx_deal_events_type on deal_events(event_type);

-- RLS policies
alter table deal_events enable row level security;

create policy "Users can view events for deals they own"
  on deal_events for select
  using (
    exists (
      select 1 from deals
      where deals.id = deal_events.deal_id
      and deals.user_id = auth.uid()
    )
  );

create policy "Users can insert events for deals they own"
  on deal_events for insert
  with check (
    exists (
      select 1 from deals
      where deals.id = deal_events.deal_id
      and deals.user_id = auth.uid()
    )
  );
