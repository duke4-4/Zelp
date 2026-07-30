import type { MaybeRefOrGetter } from 'vue'
import type { Database, BusinessImageKind } from '~~/types/database.types'

/**
 * Public, read-only business/category data access for the browse & search
 * surfaces (Phase 3). Every query here runs as whatever Supabase auth
 * context the caller happens to have (anon or signed-in) and relies
 * entirely on RLS (see supabase/migrations/0004_rls_policies.sql) to only
 * return published businesses (or the caller's own, if signed in) — no
 * client-side `status` filtering is added on top of that.
 */

export interface CategoryLite {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface BusinessImageLite {
  id: string
  url: string
  kind: BusinessImageKind
  position: number
}

export interface BusinessListItem {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  province: string | null
  avgRating: number
  reviewCount: number
  createdAt: string
  categories: CategoryLite[]
  coverImageUrl: string | null
}

export interface BusinessDetail extends BusinessListItem {
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  address: string | null
  hours: Record<string, unknown> | null
  socials: Record<string, unknown> | null
  viewCount: number
  images: BusinessImageLite[]
  owner: { id: string, fullName: string | null, avatarUrl: string | null } | null
}

export type BusinessSort = 'rating' | 'newest'

export interface BusinessListFilters {
  /** Free-text search, matched against name / city / province. */
  q?: string
  /** Category slug. */
  category?: string
  city?: string
  province?: string
  /** Minimum avg_rating (0-5). */
  minRating?: number
  sort?: BusinessSort
  page?: number
  pageSize?: number
}

export interface BusinessListResult {
  items: BusinessListItem[]
  total: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 12

// --- Raw row shapes as returned by PostgREST for our embedded selects. ---
// These are declared by hand (rather than inferred from the select string)
// and pinned via `.overrideTypes()` below, since the nested-embed inference
// in @supabase/postgrest-js is easy to get subtly wrong without a live
// project to check the generated types against.

export interface RawBusinessListRow {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  province: string | null
  avg_rating: number
  review_count: number
  created_at: string
  business_categories: { categories: CategoryLite | null }[] | null
  business_images: { url: string, kind: BusinessImageKind, position: number }[] | null
}

interface RawBusinessDetailRow extends RawBusinessListRow {
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  address: string | null
  hours: Record<string, unknown> | null
  socials: Record<string, unknown> | null
  view_count: number
  business_images: { id: string, url: string, kind: BusinessImageKind, position: number }[] | null
  owner: { id: string, full_name: string | null, avatar_url: string | null } | null
}

function pickCoverUrl(images: { url: string, kind: BusinessImageKind, position: number }[] | null): string | null {
  const list = images ?? []
  const cover = list.find(img => img.kind === 'cover')
    ?? list.slice().sort((a, b) => a.position - b.position)[0]
  return cover?.url ?? null
}

function mapCategories(rows: { categories: CategoryLite | null }[] | null): CategoryLite[] {
  return (rows ?? [])
    .map(bc => bc.categories)
    .filter((c): c is CategoryLite => !!c)
}

// Exported so `useFavourites.ts` (favourited-business summaries, same
// underlying row shape via the `favourites -> businesses` embed) can reuse
// this mapping instead of duplicating the cover-image/category logic.
export function mapListRow(row: RawBusinessListRow): BusinessListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    city: row.city,
    province: row.province,
    avgRating: row.avg_rating,
    reviewCount: row.review_count,
    createdAt: row.created_at,
    categories: mapCategories(row.business_categories),
    coverImageUrl: pickCoverUrl(row.business_images),
  }
}

function mapDetailRow(row: RawBusinessDetailRow): BusinessDetail {
  const images = (row.business_images ?? []).slice().sort((a, b) => a.position - b.position)
  return {
    ...mapListRow(row),
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    address: row.address,
    hours: row.hours,
    socials: row.socials,
    viewCount: row.view_count,
    images,
    owner: row.owner
      ? { id: row.owner.id, fullName: row.owner.full_name, avatarUrl: row.owner.avatar_url }
      : null,
  }
}

/** Strips characters that would otherwise break PostgREST's `.or()` filter grammar. */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[(),%]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Fetches all categories, for the homepage "browse by category" section and
 * the search Filters component. The table is small and public, so a single
 * unfiltered fetch (cached under one key) is fine to reuse everywhere.
 */
export function useCategories() {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData('categories-all', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, icon')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as CategoryLite[]
  }, {
    default: () => [] as CategoryLite[],
    // Non-blocking: lets pages render their category-skeleton immediately
    // on client-side navigation instead of holding up the route change.
    // SSR (first load / crawlers) still awaits this — `lazy` only affects
    // client-side navigation blocking, not the server-rendered response.
    lazy: true,
  })
}

/**
 * Cheap existence check ("does at least one visible business exist at
 * all?"), independent of any filters. Used to tell apart "no results for
 * this search" from "there's nothing in Zelp yet" empty-state messaging on
 * /search, without re-running the full filtered query.
 */
export function useHasAnyBusinesses() {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData('businesses-any-exist', async () => {
    const { count, error } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })

    if (error) throw error
    return (count ?? 0) > 0
  }, {
    default: () => false,
    lazy: true,
  })
}

/**
 * Paginated, filterable business list for the homepage "top rated" /
 * "recently added" sections and the /search results page.
 *
 * `filters` may be a ref/getter so the list re-fetches (with a fresh cache
 * key per param combination) whenever the caller's route query changes.
 */
export function useBusinessList(filters: MaybeRefOrGetter<BusinessListFilters>) {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData(
    () => `businesses-list:${JSON.stringify(toValue(filters))}`,
    async () => {
      const f = toValue(filters)
      const page = f.page && f.page > 0 ? Math.floor(f.page) : 1
      const pageSize = f.pageSize && f.pageSize > 0 ? Math.floor(f.pageSize) : DEFAULT_PAGE_SIZE
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Filtering by category requires an INNER embed at both levels so the
      // slug filter actually excludes non-matching parent business rows
      // (a left embed would just filter the nested array, not the rows).
      const hasCategoryFilter = !!f.category
      const categoriesEmbed = hasCategoryFilter
        ? 'business_categories!inner(categories!inner(id, name, slug, icon))'
        : 'business_categories(categories(id, name, slug, icon))'

      let query = supabase
        .from('businesses')
        .select(
          `id, name, slug, description, city, province, avg_rating, review_count, created_at,
           ${categoriesEmbed},
           business_images(url, kind, position)`,
          { count: 'exact' },
        )

      const term = f.q ? sanitizeSearchTerm(f.q) : ''
      if (term) {
        query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%,province.ilike.%${term}%`)
      }
      if (hasCategoryFilter) {
        query = query.eq('business_categories.categories.slug', f.category as string)
      }
      if (f.city) query = query.ilike('city', f.city)
      if (f.province) query = query.ilike('province', f.province)
      if (typeof f.minRating === 'number') query = query.gte('avg_rating', f.minRating)

      query = f.sort === 'rating'
        ? query.order('avg_rating', { ascending: false }).order('review_count', { ascending: false })
        : query.order('created_at', { ascending: false })

      query = query.range(from, to)

      const { data, error, count } = await query
        .overrideTypes<RawBusinessListRow[], { merge: false }>()

      if (error) throw error

      const result: BusinessListResult = {
        items: (data ?? []).map(mapListRow),
        total: count ?? 0,
        page,
        pageSize,
      }
      return result
    },
    {
      watch: [() => toValue(filters)],
      default: (): BusinessListResult => ({ items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE }),
      // Non-blocking on client-side navigation so the calling page's
      // skeleton (BusinessCardSkeleton) actually gets a chance to render;
      // SSR still awaits this regardless (see useCategories for details).
      lazy: true,
    },
  )
}

/**
 * Single business by slug, with categories, images and light owner info
 * joined in. Returns `null` (not an error) when the slug doesn't exist or
 * isn't visible to the caller under RLS — callers should turn that into a
 * 404 via `createError`.
 */
export function useBusinessDetail(slug: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData(
    () => `business-detail:${toValue(slug)}`,
    async () => {
      const slugValue = toValue(slug)
      if (!slugValue) return null

      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id, name, slug, description, phone, whatsapp, email, website, address,
          city, province, hours, socials, avg_rating, review_count, view_count, created_at,
          business_categories(categories(id, name, slug, icon)),
          business_images(id, url, kind, position),
          owner:profiles!businesses_owner_id_fkey(id, full_name, avatar_url)
        `)
        .eq('slug', slugValue)
        .maybeSingle()
        .overrideTypes<RawBusinessDetailRow, { merge: false }>()

      if (error) throw error
      if (!data) return null

      return mapDetailRow(data)
    },
    { watch: [() => toValue(slug)] },
  )
}

/**
 * Fire-and-forget view-count logging. Intended to be called from a page's
 * `onMounted` (client-only), so it naturally never fires during SSR and
 * never double-counts on hydration. Failures are logged, never thrown —
 * this must not be able to break rendering the page it's attached to.
 */
export function recordBusinessView(businessId: string): void {
  if (!import.meta.client || !businessId) return

  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  void supabase
    .from('business_views')
    .insert({ business_id: businessId, viewer_id: user.value?.id ?? null })
    .then(({ error }) => {
      if (error) console.error('[useBusinesses] Failed to record business view:', error.message)
    })
}
