-- Atomically spend one message credit for the authenticated user.

create or replace function public.spend_message_credit()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  update public.profiles
  set credits = credits - 1
  where id = auth.uid() and credits > 0
  returning credits into remaining;

  if remaining is null then
    return -1;
  end if;

  return remaining;
end;
$$;

revoke all on function public.spend_message_credit() from public;
grant execute on function public.spend_message_credit() to authenticated;
