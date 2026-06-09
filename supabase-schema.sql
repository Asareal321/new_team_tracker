-- Run this entire file in the Supabase SQL Editor

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  owner text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (required for anon access)
alter table tasks enable row level security;

-- Allow anyone with the anon key to read/write tasks
-- Tighten this if you add auth later
create policy "Public access" on tasks
  for all
  using (true)
  with check (true);

-- Enable real-time for live sync across teammates
alter publication supabase_realtime add table tasks;
