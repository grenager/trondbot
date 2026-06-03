-- Allow authenticated users to create their own profile row once.
-- Needed when auth.users existed before the profiles table/trigger was added.

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Backfill profiles for auth users created before the trigger existed.
insert into public.profiles (id, email, invite_code)
select
  u.id,
  u.email,
  substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
