-- Create audits table
create table public.audits (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  url         text        not null,
  page_type   text        not null,
  title       text        not null,
  result      jsonb       not null,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.audits enable row level security;

-- Users can only read their own audits
create policy "Users can view own audits"
  on public.audits for select
  using (auth.uid() = user_id);

-- Users can only create audits for themselves
create policy "Users can insert own audits"
  on public.audits for insert
  with check (auth.uid() = user_id);

-- Users can delete their own audits
create policy "Users can delete own audits"
  on public.audits for delete
  using (auth.uid() = user_id);

-- Index for fast user-scoped queries sorted by newest first
create index audits_user_id_created_at_idx
  on public.audits (user_id, created_at desc);
