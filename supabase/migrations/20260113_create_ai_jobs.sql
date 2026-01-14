-- AI Jobs table for background processing
-- Zone B: Task B1 - Database migration for AI jobs queue

create table if not exists ai_jobs (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  input_json jsonb default '{}',
  result_json jsonb default '{}',
  result_artifact_ids text[] default '{}',
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Indexes
create index if not exists idx_ai_jobs_deal_id on ai_jobs(deal_id);
create index if not exists idx_ai_jobs_status on ai_jobs(status);
create index if not exists idx_ai_jobs_created_at on ai_jobs(created_at desc);

-- RLS policies
alter table ai_jobs enable row level security;

-- For SELECT: User can see jobs for deals they own OR jobs they created (when deal_id is null)
create policy "Users can view jobs for deals they own or jobs they created"
  on ai_jobs for select
  using (
    (deal_id is null and created_by = auth.uid())
    or exists (
      select 1 from deals
      where deals.id = ai_jobs.deal_id
      and deals.user_id = auth.uid()
    )
  );

-- For INSERT: User can create jobs for deals they own OR jobs without a deal (assigned to them)
create policy "Users can insert jobs for deals they own"
  on ai_jobs for insert
  with check (
    (deal_id is null and (created_by = auth.uid() or created_by is null))
    or exists (
      select 1 from deals
      where deals.id = ai_jobs.deal_id
      and deals.user_id = auth.uid()
    )
  );

-- For UPDATE: User can update jobs for deals they own OR jobs they created
create policy "Users can update jobs for deals they own or jobs they created"
  on ai_jobs for update
  using (
    (deal_id is null and created_by = auth.uid())
    or exists (
      select 1 from deals
      where deals.id = ai_jobs.deal_id
      and deals.user_id = auth.uid()
    )
  );
