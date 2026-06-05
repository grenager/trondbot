-- Conversation memories for personalization across sessions.

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index memories_user_id_created_at on public.memories (user_id, created_at desc);

alter table public.memories enable row level security;

create policy "Users can view own memories"
  on public.memories
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own memories"
  on public.memories
  for insert
  with check (auth.uid() = user_id);
