-- 0003_functions_and_triggers.sql
-- Zelp Phase 1: trigger functions + triggers.
--   1. set_updated_at()      -- generic updated_at maintenance
--   2. handle_new_user()     -- auto-create a profiles row on signup
--   3. update_business_rating() -- keep businesses.avg_rating/review_count in sync

-- ---------------------------------------------------------------------------
-- 1. Generic updated_at maintenance.
-- Runs as invoker (no elevated rights needed): it only touches the row the
-- caller is already permitted to UPDATE under the table's own RLS policy.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.businesses;
create trigger set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.reviews;
create trigger set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.subscriptions;
create trigger set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.payments;
create trigger set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Auto-create a profiles row whenever a new auth.users row is inserted.
-- SECURITY DEFINER is required: this trigger fires during signup, before
-- the new user has an authenticated session, so it must run with the
-- privileges of the function owner (bypassing profiles' RLS INSERT policy,
-- which otherwise requires auth.uid() = id).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Keep businesses.avg_rating / review_count in sync with reviews.
-- Handles INSERT, UPDATE (including a review moving to a different
-- business_id, which recomputes both the old and new parent rows) and
-- DELETE (using OLD.business_id, since NEW is null on delete).
-- SECURITY DEFINER so the trigger can update businesses regardless of the
-- reviewer's own UPDATE rights on that table (reviewers don't own the
-- business row they're rating).
-- ---------------------------------------------------------------------------
create or replace function public.update_business_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Recompute the previous parent business on DELETE, or on UPDATE when the
  -- review was moved to a different business.
  if (tg_op = 'DELETE') or (tg_op = 'UPDATE' and old.business_id <> new.business_id) then
    update public.businesses
    set
      avg_rating = coalesce(
        (select round(avg(rating)::numeric, 2) from public.reviews where business_id = old.business_id),
        0
      ),
      review_count = (select count(*) from public.reviews where business_id = old.business_id)
    where id = old.business_id;
  end if;

  -- Recompute the (new) parent business on INSERT/UPDATE.
  if tg_op in ('INSERT', 'UPDATE') then
    update public.businesses
    set
      avg_rating = coalesce(
        (select round(avg(rating)::numeric, 2) from public.reviews where business_id = new.business_id),
        0
      ),
      review_count = (select count(*) from public.reviews where business_id = new.business_id)
    where id = new.business_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists update_business_rating on public.reviews;
create trigger update_business_rating
  after insert or update or delete on public.reviews
  for each row execute function public.update_business_rating();
