-- 0002_tables.sql
-- Zelp Phase 1: core schema tables, in FK dependency order.
-- RLS is enabled and policies are defined in 0004_rls_policies.sql.

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users row; auto-created by the handle_new_user() trigger
-- defined in 0003_functions_and_triggers.sql.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  location text,
  website text,
  socials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ---------------------------------------------------------------------------
-- categories
-- Starts empty; populated via dashboard / service role only (see RLS notes).
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  phone text,
  whatsapp text,
  email text,
  website text,
  address text,
  city text,
  province text,
  lat double precision,
  lng double precision,
  hours jsonb not null default '{}'::jsonb,
  socials jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'suspended')),
  avg_rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists businesses_owner_id_idx on public.businesses(owner_id);
create index if not exists businesses_status_idx on public.businesses(status);
create index if not exists businesses_city_idx on public.businesses(city);

-- ---------------------------------------------------------------------------
-- business_categories (join table)
-- ---------------------------------------------------------------------------
create table if not exists public.business_categories (
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (business_id, category_id)
);

create index if not exists business_categories_category_id_idx
  on public.business_categories(category_id);

-- ---------------------------------------------------------------------------
-- business_images
-- ---------------------------------------------------------------------------
create table if not exists public.business_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  url text not null,
  kind text not null check (kind in ('logo', 'cover', 'gallery')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists business_images_business_id_idx
  on public.business_images(business_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (business_id, user_id)
);

create index if not exists reviews_business_id_idx on public.reviews(business_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);

-- ---------------------------------------------------------------------------
-- favourites (join table)
-- ---------------------------------------------------------------------------
create table if not exists public.favourites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

create index if not exists favourites_business_id_idx on public.favourites(business_id);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  tier text not null,
  status text not null default 'pending'
    check (status in ('active', 'expired', 'pending', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists subscriptions_business_id_idx on public.subscriptions(business_id);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  paynow_reference text,
  poll_url text,
  amount numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'failed')),
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists payments_business_id_idx on public.payments(business_id);
create index if not exists payments_subscription_id_idx on public.payments(subscription_id);

-- ---------------------------------------------------------------------------
-- business_views
-- Judgment call: uses `viewed_at` (as specified) as the single event
-- timestamp instead of also adding a redundant `created_at` column, since
-- the two would always be identical for an insert-only event log table.
-- ---------------------------------------------------------------------------
create table if not exists public.business_views (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  viewer_id uuid references public.profiles(id) on delete set null
);

create index if not exists business_views_business_id_idx on public.business_views(business_id);
