-- 0006_seed_categories.sql
-- Zelp: baseline category taxonomy.
--
-- `categories` is reference/taxonomy data (the fixed list of business types
-- Zelp organizes listings under), not business/review content -- there is
-- still zero fake business, review or user data anywhere in this project.
-- Every real production instance of a directory app needs *some* category
-- list to exist before an owner can classify their listing; this seeds a
-- sensible baseline that any admin can edit/extend later via the dashboard
-- (once one exists) or directly in the table.

insert into public.categories (name, slug, icon) values
  ('Restaurants',      'restaurants',      'i-lucide-utensils'),
  ('Cafes & Bakeries',  'cafes-bakeries',   'i-lucide-coffee'),
  ('Bars & Nightlife',  'bars-nightlife',   'i-lucide-martini'),
  ('Hotels & Lodges',   'hotels-lodges',    'i-lucide-bed-double'),
  ('Salons & Beauty',   'salons-beauty',    'i-lucide-sparkles'),
  ('Health & Wellness', 'health-wellness',  'i-lucide-heart-pulse'),
  ('Home Services',     'home-services',    'i-lucide-wrench'),
  ('Automotive',        'automotive',       'i-lucide-car'),
  ('Shopping & Retail',  'shopping-retail', 'i-lucide-shopping-bag'),
  ('Groceries & Markets', 'groceries-markets', 'i-lucide-shopping-basket'),
  ('Professional Services', 'professional-services', 'i-lucide-briefcase'),
  ('Education & Training', 'education-training', 'i-lucide-graduation-cap'),
  ('Events & Entertainment', 'events-entertainment', 'i-lucide-party-popper'),
  ('Travel & Tourism',  'travel-tourism',   'i-lucide-map'),
  ('Fitness & Sport',   'fitness-sport',    'i-lucide-dumbbell')
on conflict (slug) do nothing;
