-- 0004_rls_policies.sql
-- Zelp Phase 1: Row Level Security. Every table gets RLS enabled; policies
-- are as narrow as the product brief allows. All policies are dropped and
-- recreated (drop-if-exists then create) so this file is safe to re-run.

-- =============================================================================
-- profiles
-- Public/anon can read (reviewer & owner names need to render on public
-- pages). Only the owning user can insert/update their own row. No DELETE
-- policy: profiles are not user-deletable in v1; the row is removed via the
-- `on delete cascade` from auth.users, which happens through the service
-- role / Supabase auth admin API, not through client RLS.
-- =============================================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  to public
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =============================================================================
-- categories
-- Public read only. No insert/update/delete policy for anon/authenticated:
-- category management happens via the dashboard / service role only, since
-- there is no admin UI in scope for this phase.
-- =============================================================================
alter table public.categories enable row level security;

drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
  on public.categories for select
  to public
  using (true);

-- =============================================================================
-- businesses
-- Visible to everyone once published, or to the owner regardless of status.
-- Only the owner can insert (as themselves), update or delete their listing.
-- =============================================================================
alter table public.businesses enable row level security;

drop policy if exists "businesses_select_visible" on public.businesses;
create policy "businesses_select_visible"
  on public.businesses for select
  to public
  using (status = 'published' or auth.uid() = owner_id);

drop policy if exists "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own"
  on public.businesses for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "businesses_update_own" on public.businesses;
create policy "businesses_update_own"
  on public.businesses for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "businesses_delete_own" on public.businesses;
create policy "businesses_delete_own"
  on public.businesses for delete
  to authenticated
  using (auth.uid() = owner_id);

-- =============================================================================
-- business_categories
-- Visibility mirrors the parent business (published, or owned by caller).
-- Writes restricted to the owner of the referenced business.
-- =============================================================================
alter table public.business_categories enable row level security;

drop policy if exists "business_categories_select_visible" on public.business_categories;
create policy "business_categories_select_visible"
  on public.business_categories for select
  to public
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_categories.business_id
        and (b.status = 'published' or b.owner_id = auth.uid())
    )
  );

drop policy if exists "business_categories_insert_own" on public.business_categories;
create policy "business_categories_insert_own"
  on public.business_categories for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_categories.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "business_categories_update_own" on public.business_categories;
create policy "business_categories_update_own"
  on public.business_categories for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_categories.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_categories.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "business_categories_delete_own" on public.business_categories;
create policy "business_categories_delete_own"
  on public.business_categories for delete
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_categories.business_id
        and b.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- business_images
-- Same visibility/ownership pattern as business_categories.
-- =============================================================================
alter table public.business_images enable row level security;

drop policy if exists "business_images_select_visible" on public.business_images;
create policy "business_images_select_visible"
  on public.business_images for select
  to public
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_images.business_id
        and (b.status = 'published' or b.owner_id = auth.uid())
    )
  );

drop policy if exists "business_images_insert_own" on public.business_images;
create policy "business_images_insert_own"
  on public.business_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_images.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "business_images_update_own" on public.business_images;
create policy "business_images_update_own"
  on public.business_images for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_images.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_images.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "business_images_delete_own" on public.business_images;
create policy "business_images_delete_own"
  on public.business_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_images.business_id
        and b.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- reviews
-- Public read. Insert requires the caller to be the review author AND not
-- the owner of the business being reviewed (no self-reviews). Update/delete
-- restricted to the review's own author.
-- =============================================================================
alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
  on public.reviews for select
  to public
  using (true);

drop policy if exists "reviews_insert_own_not_owner" on public.reviews;
create policy "reviews_insert_own_not_owner"
  on public.reviews for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and business_id in (
      select id from public.businesses where owner_id <> auth.uid()
    )
  );

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- favourites
-- Fully private to the owning user: no public read of others' favourites.
-- No UPDATE policy -- favourites is a toggle table (insert to add, delete to
-- remove), there is nothing to update in place.
-- =============================================================================
alter table public.favourites enable row level security;

drop policy if exists "favourites_select_own" on public.favourites;
create policy "favourites_select_own"
  on public.favourites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "favourites_insert_own" on public.favourites;
create policy "favourites_insert_own"
  on public.favourites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "favourites_delete_own" on public.favourites;
create policy "favourites_delete_own"
  on public.favourites for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- subscriptions
-- SELECT only, restricted to the owning business's owner. INTENTIONALLY no
-- INSERT/UPDATE/DELETE policy for anon/authenticated: subscriptions are
-- written exclusively via the service-role key from server/api routes in a
-- later phase (Paynow webhook handling etc.), which bypasses RLS entirely.
-- Do NOT add client write policies here -- that would let a signed-in user
-- forge their own "active" subscription.
-- =============================================================================
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = subscriptions.business_id
        and b.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- payments
-- Same rationale as subscriptions above: SELECT-only for the business
-- owner; all writes happen server-side via the service role (Paynow
-- initiate/poll flow), bypassing RLS. INTENTIONALLY no client write policy.
-- =============================================================================
alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = payments.business_id
        and b.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- business_views
-- Insert open to everyone, including anon, so anonymous view tracking
-- works. Select restricted to the owning business's owner (analytics).
-- =============================================================================
alter table public.business_views enable row level security;

drop policy if exists "business_views_insert_all" on public.business_views;
create policy "business_views_insert_all"
  on public.business_views for insert
  to public
  with check (true);

drop policy if exists "business_views_select_own" on public.business_views;
create policy "business_views_select_own"
  on public.business_views for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_views.business_id
        and b.owner_id = auth.uid()
    )
  );
