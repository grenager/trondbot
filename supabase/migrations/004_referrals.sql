-- Referral tracking and server-side credit grants for invite-a-friend.

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles (id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referee_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'completed')),
  grace_credits_granted integer not null default 0 check (grace_credits_granted >= 0),
  full_credits_granted integer not null default 0 check (full_credits_granted >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists referrals_referrer_id_status_idx
  on public.referrals (referrer_id, status);

create index if not exists referrals_referee_id_idx
  on public.referrals (referee_id);

alter table public.referrals enable row level security;

create policy "Referrers can view own referrals"
  on public.referrals
  for select
  using (auth.uid() = referrer_id);

create or replace function public.add_referral_credits(amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_credits integer;
  max_credits constant integer := 1000;
begin
  if amount is null or amount <= 0 then
    return -1;
  end if;

  update public.profiles
  set credits = least(max_credits, credits + amount)
  where id = auth.uid()
  returning credits into new_credits;

  if new_credits is null then
    return -1;
  end if;

  return new_credits;
end;
$$;

create or replace function public.add_referral_credits_for_user(
  target_user_id uuid,
  amount integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_credits integer;
  max_credits constant integer := 1000;
begin
  if target_user_id is null or amount is null or amount <= 0 then
    return -1;
  end if;

  update public.profiles
  set credits = least(max_credits, credits + amount)
  where id = target_user_id
  returning credits into new_credits;

  if new_credits is null then
    return -1;
  end if;

  return new_credits;
end;
$$;

create or replace function public.create_referral_invite()
returns table (
  invite_code text,
  credits integer,
  grace_credits integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid := auth.uid();
  pending_count integer;
  grace_amount constant integer := 20;
  user_invite_code text;
  updated_credits integer;
  new_referral_id uuid;
begin
  if v_referrer_id is null then
    raise exception 'Not authenticated';
  end if;

  select count(*)
  into pending_count
  from public.referrals
  where referrer_id = v_referrer_id
    and status = 'pending';

  if pending_count >= 5 then
    raise exception 'PENDING_REFERRAL_CAP';
  end if;

  select p.invite_code
  into user_invite_code
  from public.profiles p
  where p.id = v_referrer_id;

  if user_invite_code is null then
    raise exception 'Profile not found';
  end if;

  insert into public.referrals (
    referrer_id,
    status,
    grace_credits_granted
  )
  values (
    v_referrer_id,
    'pending',
    grace_amount
  )
  returning id into new_referral_id;

  updated_credits := public.add_referral_credits(grace_amount);

  if updated_credits < 0 then
    raise exception 'Could not grant grace credits';
  end if;

  return query
  select user_invite_code, updated_credits, grace_amount;
end;
$$;

create or replace function public.redeem_referral(ref_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referee_id uuid := auth.uid();
  referrer_profile public.profiles%rowtype;
  referee_profile public.profiles%rowtype;
  pending_referral public.referrals%rowtype;
  total_reward constant integer := 100;
  completion_amount integer;
begin
  if v_referee_id is null then
    return false;
  end if;

  if ref_code is null or length(trim(ref_code)) = 0 then
    return false;
  end if;

  select *
  into referee_profile
  from public.profiles
  where id = v_referee_id;

  if not found then
    return false;
  end if;

  if referee_profile.referred_by is not null then
    return false;
  end if;

  select *
  into referrer_profile
  from public.profiles
  where invite_code = trim(ref_code);

  if not found then
    return false;
  end if;

  if referrer_profile.id = v_referee_id then
    return false;
  end if;

  update public.profiles
  set referred_by = referrer_profile.id
  where id = v_referee_id
    and referred_by is null;

  if not found then
    return false;
  end if;

  select *
  into pending_referral
  from public.referrals
  where referrer_id = referrer_profile.id
    and status = 'pending'
  order by created_at asc
  limit 1
  for update;

  if found then
    completion_amount := total_reward - pending_referral.grace_credits_granted;

    update public.referrals
    set
      status = 'completed',
      referee_id = v_referee_id,
      full_credits_granted = completion_amount,
      completed_at = now()
    where id = pending_referral.id;
  else
    completion_amount := total_reward;

    insert into public.referrals (
      referrer_id,
      referee_id,
      status,
      grace_credits_granted,
      full_credits_granted,
      completed_at
    )
    values (
      referrer_profile.id,
      v_referee_id,
      'completed',
      0,
      completion_amount,
      now()
    );
  end if;

  if completion_amount > 0 then
    perform public.add_referral_credits_for_user(
      referrer_profile.id,
      completion_amount
    );
  end if;

  return true;
end;
$$;

revoke all on function public.add_referral_credits(integer) from public;
grant execute on function public.add_referral_credits(integer) to authenticated;

revoke all on function public.add_referral_credits_for_user(uuid, integer) from public;

revoke all on function public.create_referral_invite() from public;
grant execute on function public.create_referral_invite() to authenticated;

revoke all on function public.redeem_referral(text) from public;
grant execute on function public.redeem_referral(text) to authenticated;
