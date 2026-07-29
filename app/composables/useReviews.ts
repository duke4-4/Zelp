import type { MaybeRefOrGetter } from 'vue'
import type { Database } from '~~/types/database.types'

/**
 * Reviews data access (Phase 4). Reads run under whatever Supabase auth
 * context the caller has (reviews are publicly readable per RLS); writes
 * require a signed-in user and are further constrained by RLS:
 *   - INSERT: `auth.uid() = user_id` AND the business isn't owned by that
 *     same user (no self-reviews) — enforced at the DB policy level, this
 *     file just surfaces the resulting Postgres error with a clear message
 *     if it somehow fires (the UI layer is expected to not even show the
 *     form to owners, see business/[slug].vue).
 *   - UPDATE/DELETE: `auth.uid() = user_id` (own reviews only).
 *   - `unique(business_id, user_id)`: one review per user per business.
 *
 * `businesses.avg_rating` / `review_count` are kept in sync by a DB trigger
 * on any reviews insert/update/delete — this file never writes those
 * columns, and callers should `refresh()` their business-detail fetch after
 * a mutation to pick up the new aggregate.
 */

export interface ReviewReviewer {
  id: string
  fullName: string | null
  avatarUrl: string | null
}

export interface ReviewItem {
  id: string
  businessId: string
  userId: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string | null
  reviewer: ReviewReviewer
}

export interface ReviewListResult {
  items: ReviewItem[]
  total: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 10
const REVIEW_SELECT = 'id, business_id, user_id, rating, comment, created_at, updated_at, profiles(id, full_name, avatar_url)'

interface RawReviewRow {
  id: string
  business_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string | null
  profiles: { id: string, full_name: string | null, avatar_url: string | null } | null
}

function mapReviewRow(row: RawReviewRow): ReviewItem {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewer: {
      id: row.profiles?.id ?? row.user_id,
      fullName: row.profiles?.full_name ?? null,
      avatarUrl: row.profiles?.avatar_url ?? null,
    },
  }
}

/**
 * Normalizes a Supabase/Postgres error from a review mutation into a
 * friendly, user-facing message rather than letting a raw Postgres error
 * string (or code) reach the UI.
 */
function toReviewError(error: unknown): Error {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    // Postgres unique_violation — the `unique(business_id, user_id)` constraint.
    if (code === '23505') {
      return new Error('You\'ve already reviewed this business. You can edit your existing review instead.')
    }
    // Postgres insufficient_privilege — RLS policy rejected the write. In
    // practice this is the no-self-review policy, since the UI never shows
    // the form to owners or lets a signed-out user submit.
    if (code === '42501') {
      return new Error('You can\'t review your own business.')
    }
  }
  if (error instanceof Error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message))
  }
  return new Error('Something went wrong. Please try again.')
}

/**
 * Paginated reviews for a business, newest first, joined with the
 * reviewer's profile for name/avatar.
 */
export function useBusinessReviews(businessId: MaybeRefOrGetter<string>, page: MaybeRefOrGetter<number> = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const supabase = useSupabaseClient<Database>()

  return useAsyncData(
    () => `business-reviews:${toValue(businessId)}:${toValue(page)}`,
    async () => {
      const id = toValue(businessId)
      const pageValue = Math.max(1, Math.floor(toValue(page) || 1))
      const from = (pageValue - 1) * pageSize
      const to = from + pageSize - 1

      if (!id) {
        return { items: [], total: 0, page: pageValue, pageSize } satisfies ReviewListResult
      }

      const { data, error, count } = await supabase
        .from('reviews')
        .select(REVIEW_SELECT, { count: 'exact' })
        .eq('business_id', id)
        .order('created_at', { ascending: false })
        .range(from, to)
        .overrideTypes<RawReviewRow[], { merge: false }>()

      if (error) throw error

      return {
        items: (data ?? []).map(mapReviewRow),
        total: count ?? 0,
        page: pageValue,
        pageSize,
      } satisfies ReviewListResult
    },
    {
      watch: [() => toValue(businessId), () => toValue(page)],
      default: (): ReviewListResult => ({ items: [], total: 0, page: 1, pageSize }),
      lazy: true,
    },
  )
}

/**
 * The current signed-in user's own review of a business, if any — used to
 * decide whether to show "write a review" or "edit your review". Resolves
 * to `null` (not an error) when signed out or when no review exists yet.
 */
export function useMyReview(businessId: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  return useAsyncData(
    () => `my-review:${toValue(businessId)}:${user.value?.id ?? 'anon'}`,
    async () => {
      const id = toValue(businessId)
      if (!id || !user.value) return null

      const { data, error } = await supabase
        .from('reviews')
        .select(REVIEW_SELECT)
        .eq('business_id', id)
        .eq('user_id', user.value.id)
        .maybeSingle()
        .overrideTypes<RawReviewRow, { merge: false }>()

      if (error) throw error
      return data ? mapReviewRow(data) : null
    },
    {
      watch: [() => toValue(businessId), () => user.value?.id],
      default: () => null as ReviewItem | null,
    },
  )
}

/** Creates a new review. Throws a friendly `Error` on failure (see `toReviewError`). */
export async function createReview(businessId: string, rating: number, comment: string | null): Promise<ReviewItem> {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  if (!user.value) throw new Error('You need to be signed in to write a review.')

  const { data, error } = await supabase
    .from('reviews')
    .insert({ business_id: businessId, user_id: user.value.id, rating, comment: comment || null })
    .select(REVIEW_SELECT)
    .single()
    .overrideTypes<RawReviewRow, { merge: false }>()

  if (error) throw toReviewError(error)
  return mapReviewRow(data)
}

/** Updates the caller's own review. RLS restricts this to `auth.uid() = user_id` rows. */
export async function updateReview(reviewId: string, rating: number, comment: string | null): Promise<ReviewItem> {
  const supabase = useSupabaseClient<Database>()

  const { data, error } = await supabase
    .from('reviews')
    .update({ rating, comment: comment || null })
    .eq('id', reviewId)
    .select(REVIEW_SELECT)
    .single()
    .overrideTypes<RawReviewRow, { merge: false }>()

  if (error) throw toReviewError(error)
  return mapReviewRow(data)
}

/** Deletes the caller's own review. RLS restricts this to `auth.uid() = user_id` rows. */
export async function deleteReview(reviewId: string): Promise<void> {
  const supabase = useSupabaseClient<Database>()

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) throw toReviewError(error)
}
