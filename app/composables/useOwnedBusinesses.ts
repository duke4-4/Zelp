import type { MaybeRefOrGetter } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, BusinessStatus, SubscriptionStatus, Json } from '~~/types/database.types'

/**
 * Business-owner CRUD + dashboard data access (Phase 5). Unlike
 * `useBusinesses.ts` (public, read-only, published-only-unless-owner),
 * everything here is scoped to "my own businesses": listing/fetching relies
 * on RLS letting an owner see their own rows regardless of `status`
 * (`businesses_select_visible`), and every write is further constrained by
 * `businesses_update_own` / `business_categories_*_own` (auth.uid() =
 * owner_id) — see supabase/migrations/0004_rls_policies.sql.
 *
 * Status: the client here can only ever move a business between 'draft'
 * and 'pending' (see `setBusinessStatus`). Publishing ('published') is
 * gated by the subscription/payment flow built in Phase 8 and will be
 * applied server-side (service role, once that flow exists) — nothing in
 * this file, or in any page that calls it, writes `status: 'published'`.
 * 'suspended' is a moderation action, also out of scope for the client.
 */

export interface OwnedBusinessListItem {
  id: string
  name: string
  slug: string
  status: BusinessStatus
  city: string | null
  province: string | null
  avgRating: number
  reviewCount: number
  createdAt: string
}

export interface OwnedBusinessDetail {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  address: string | null
  city: string | null
  province: string | null
  lat: number | null
  lng: number | null
  hours: Record<string, unknown>
  socials: Record<string, unknown>
  status: BusinessStatus
  avgRating: number
  reviewCount: number
  viewCount: number
  createdAt: string
  updatedAt: string | null
  categoryIds: string[]
}

/** Editable field set shared by the create and edit forms. Deliberately
 * excludes `status` (see `setBusinessStatus`) and `slug` (immutable after
 * creation, for stable URLs). */
export interface BusinessFormInput {
  name: string
  description: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  address: string | null
  city: string | null
  province: string | null
  lat: number | null
  lng: number | null
  hours: Record<string, unknown>
  socials: Record<string, unknown>
  categoryIds: string[]
}

export interface BusinessDashboardStats {
  viewCount: number
  subscriptionStatus: SubscriptionStatus | null
}

/** Display metadata for a business's `status`, shared by the owner-facing
 * management list, edit page and dashboard so the badge treatment stays
 * consistent everywhere it's shown. */
export const BUSINESS_STATUS_META: Record<BusinessStatus, { label: string, color: 'neutral' | 'warning' | 'success' | 'error' }> = {
  draft: { label: 'Draft', color: 'neutral' },
  pending: { label: 'Pending review', color: 'warning' },
  published: { label: 'Published', color: 'success' },
  suspended: { label: 'Suspended', color: 'error' },
}

const OWNED_LIST_SELECT = 'id, name, slug, status, city, province, avg_rating, review_count, created_at'
const OWNED_DETAIL_SELECT = `
  id, owner_id, name, slug, description, phone, whatsapp, email, website, address,
  city, province, lat, lng, hours, socials, status, avg_rating, review_count, view_count,
  created_at, updated_at,
  business_categories(category_id)
`

interface RawOwnedListRow {
  id: string
  name: string
  slug: string
  status: BusinessStatus
  city: string | null
  province: string | null
  avg_rating: number
  review_count: number
  created_at: string
}

interface RawOwnedDetailRow {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  address: string | null
  city: string | null
  province: string | null
  lat: number | null
  lng: number | null
  hours: Json
  socials: Json
  status: BusinessStatus
  avg_rating: number
  review_count: number
  view_count: number
  created_at: string
  updated_at: string | null
  business_categories: { category_id: string }[] | null
}

function mapListRow(row: RawOwnedListRow): OwnedBusinessListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    city: row.city,
    province: row.province,
    avgRating: row.avg_rating,
    reviewCount: row.review_count,
    createdAt: row.created_at,
  }
}

function mapDetailRow(row: RawOwnedDetailRow): OwnedBusinessDetail {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    address: row.address,
    city: row.city,
    province: row.province,
    lat: row.lat,
    lng: row.lng,
    hours: (row.hours ?? {}) as Record<string, unknown>,
    socials: (row.socials ?? {}) as Record<string, unknown>,
    status: row.status,
    avgRating: row.avg_rating,
    reviewCount: row.review_count,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryIds: (row.business_categories ?? []).map(bc => bc.category_id),
  }
}

/**
 * Normalizes a Supabase/Postgres error from a business mutation into a
 * friendly, user-facing message.
 */
function toBusinessError(error: unknown): Error {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    // Postgres unique_violation — in practice the `businesses.slug` unique
    // constraint, if two creates raced each other past `generateUniqueSlug`'s
    // own check. Extremely unlikely, but not impossible.
    if (code === '23505') {
      return new Error('That business URL is already taken. Please try saving again.')
    }
    if (code === '42501') {
      return new Error('You don\'t have permission to do that.')
    }
  }
  if (error instanceof Error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message))
  }
  return new Error('Something went wrong. Please try again.')
}

/**
 * Turns a business name into a slug that's actually unique against
 * `businesses.slug` right now, by checking `slugify(name)` and then
 * `${base}-2`, `${base}-3`, ... until a free one is found. This is a
 * check-then-insert (not atomic), so `createBusiness` also handles the
 * rare race via `toBusinessError`'s `23505` case below.
 */
async function generateUniqueSlug(supabase: SupabaseClient<Database>, name: string): Promise<string> {
  const base = slugify(name)
  let candidate = base
  let attempt = 1

  // Pragmatic bound — a name colliding with 25 existing slugs isn't a
  // realistic scenario for this dataset; bail out with a clear error
  // rather than looping forever.
  while (attempt <= 25) {
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) throw error
    if (!data) return candidate

    attempt += 1
    candidate = `${base}-${attempt}`
  }

  throw new Error('Could not generate a unique URL for this business name. Please try a different name.')
}

/**
 * Replaces a business's category associations wholesale (delete all, then
 * re-insert the given set) rather than diffing — simpler, and the join
 * table has no extra per-row data worth preserving across a diff.
 */
async function syncBusinessCategories(supabase: SupabaseClient<Database>, businessId: string, categoryIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('business_categories')
    .delete()
    .eq('business_id', businessId)
  if (deleteError) throw deleteError

  if (categoryIds.length === 0) return

  const rows = categoryIds.map(categoryId => ({ business_id: businessId, category_id: categoryId }))
  const { error: insertError } = await supabase.from('business_categories').insert(rows)
  if (insertError) throw insertError
}

/**
 * All of the current user's own businesses, any status, newest first — for
 * the `/business` management hub. Resolves to an empty list (not an error)
 * when signed out.
 */
export function useMyBusinesses() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  return useAsyncData(
    () => `my-businesses:${user.value?.id ?? 'anon'}`,
    async () => {
      if (!user.value) return [] as OwnedBusinessListItem[]

      const { data, error } = await supabase
        .from('businesses')
        .select(OWNED_LIST_SELECT)
        .eq('owner_id', user.value.id)
        .order('created_at', { ascending: false })
        .overrideTypes<RawOwnedListRow[], { merge: false }>()

      if (error) throw error
      return (data ?? []).map(mapListRow)
    },
    {
      default: () => [] as OwnedBusinessListItem[],
      watch: [() => user.value?.id],
      lazy: true,
    },
  )
}

/**
 * A single owned business by id, with its category ids, for the edit form.
 * Resolves to `null` when the id doesn't exist or isn't visible under RLS
 * (i.e. not this caller's own business and not published) — callers should
 * turn that into a 404. Note: this alone does NOT verify the caller is the
 * *owner* (a published business owned by someone else is also "visible") —
 * routes that use this for editing combine it with the `business-owner`
 * middleware, which does the real ownership check.
 */
export function useOwnedBusiness(id: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData(
    () => `owned-business:${toValue(id)}`,
    async () => {
      const idValue = toValue(id)
      if (!idValue) return null

      const { data, error } = await supabase
        .from('businesses')
        .select(OWNED_DETAIL_SELECT)
        .eq('id', idValue)
        .maybeSingle()
        .overrideTypes<RawOwnedDetailRow, { merge: false }>()

      if (error) throw error
      return data ? mapDetailRow(data) : null
    },
    { watch: [() => toValue(id)] },
  )
}

/**
 * Creates a new business, owned by the signed-in user, always starting as
 * `status: 'draft'` — see the module-level comment on status transitions.
 * Auto-generates a unique slug from `input.name`. Throws a friendly `Error`
 * on failure (see `toBusinessError`).
 */
export async function createBusiness(input: BusinessFormInput): Promise<{ id: string, slug: string }> {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  if (!user.value) throw new Error('You need to be signed in to create a business.')

  const name = input.name.trim()
  if (!name) throw new Error('Business name is required.')

  const slug = await generateUniqueSlug(supabase, name)

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: user.value.id,
      name,
      slug,
      description: input.description,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      website: input.website,
      address: input.address,
      city: input.city,
      province: input.province,
      lat: input.lat,
      lng: input.lng,
      hours: input.hours as Json,
      socials: input.socials as Json,
      // See module-level comment: new businesses always start as drafts.
      // Nothing here (or anywhere else in this file) ever writes 'published'.
      status: 'draft',
    })
    .select('id, slug')
    .single()

  if (error) throw toBusinessError(error)

  await syncBusinessCategories(supabase, data.id, input.categoryIds)

  return { id: data.id, slug: data.slug }
}

/**
 * Updates an existing business's editable fields and category associations.
 * Does NOT touch `status` (see `setBusinessStatus`) or `slug` (immutable
 * after creation). RLS restricts this to `auth.uid() = owner_id` rows.
 */
export async function updateBusiness(id: string, input: BusinessFormInput): Promise<void> {
  const supabase = useSupabaseClient<Database>()

  const name = input.name.trim()
  if (!name) throw new Error('Business name is required.')

  const { error } = await supabase
    .from('businesses')
    .update({
      name,
      description: input.description,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      website: input.website,
      address: input.address,
      city: input.city,
      province: input.province,
      lat: input.lat,
      lng: input.lng,
      hours: input.hours as Json,
      socials: input.socials as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw toBusinessError(error)

  await syncBusinessCategories(supabase, id, input.categoryIds)
}

/**
 * Owner-facing status transitions ONLY — the TS parameter type is the
 * enforcement: it can only ever express 'draft' or 'pending', so this
 * function is structurally incapable of setting 'published' or 'suspended'
 * no matter what a caller passes in. Publishing is gated by the
 * subscription/payment flow (Phase 8, out of scope here) and will be
 * applied server-side once that exists; suspension is a moderation action.
 */
export async function setBusinessStatus(id: string, status: Extract<BusinessStatus, 'draft' | 'pending'>): Promise<void> {
  const supabase = useSupabaseClient<Database>()

  const { error } = await supabase
    .from('businesses')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw toBusinessError(error)
}

/**
 * Dashboard stats not already carried on the business row itself
 * (`avg_rating` / `review_count` / `status` — see `OwnedBusinessListItem` /
 * `OwnedBusinessDetail`, both trigger-maintained or direct columns, no
 * separate fetch needed for those):
 *  - `viewCount`: total rows in `business_views` for this business. RLS
 *    (`business_views_select_own`) restricts this count to the owner.
 *  - `subscriptionStatus`: the most recent `subscriptions` row's status, or
 *    `null` if the business has never had one ("No active subscription").
 *    Phase 8 hasn't built the purchase flow yet, so `null` is the expected,
 *    genuine state for every business right now — never faked here.
 */
export function useBusinessDashboardStats(businessId: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData(
    () => `business-dashboard-stats:${toValue(businessId)}`,
    async () => {
      const id = toValue(businessId)
      if (!id) {
        return { viewCount: 0, subscriptionStatus: null } satisfies BusinessDashboardStats
      }

      const [viewsResult, subscriptionResult] = await Promise.all([
        supabase.from('business_views').select('id', { count: 'exact', head: true }).eq('business_id', id),
        supabase.from('subscriptions').select('status').eq('business_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      if (viewsResult.error) throw viewsResult.error
      if (subscriptionResult.error) throw subscriptionResult.error

      return {
        viewCount: viewsResult.count ?? 0,
        subscriptionStatus: subscriptionResult.data?.status ?? null,
      } satisfies BusinessDashboardStats
    },
    {
      watch: [() => toValue(businessId)],
      default: (): BusinessDashboardStats => ({ viewCount: 0, subscriptionStatus: null }),
      lazy: true,
    },
  )
}
