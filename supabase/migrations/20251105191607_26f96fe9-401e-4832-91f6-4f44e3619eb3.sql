-- Functions to support swap dialog without exposing full tables under RLS
-- 1) List agent basic info (id, name)
create or replace function public.list_agents_for_swaps()
returns table (
  id uuid,
  name text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, coalesce(p.name, '') as name
  from public.profiles p;
$$;

-- 2) List future shifts (used for own shifts and other agents' shifts)
create or replace function public.list_future_shifts_for_swaps()
returns table (
  id uuid,
  user_id uuid,
  shift_date date,
  start_time time without time zone,
  end_time time without time zone,
  shift_type text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.user_id, s.shift_date, s.start_time, s.end_time, s.shift_type
  from public.shifts s
  where s.shift_date >= now()::date
  order by s.shift_date asc;
$$;

-- Grant execute to authenticated users only
grant execute on function public.list_agents_for_swaps() to authenticated;
grant execute on function public.list_future_shifts_for_swaps() to authenticated;
