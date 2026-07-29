import type { Database } from '~~/types/database.types'
import type { BusinessListItem, RawBusinessListRow } from '~/composables/useBusinesses'
import { mapListRow } from '~/composables/useBusinesses'

/**
 * Favourites (save-for-later) data access (Phase 4). The `favourites`
 * table is fully private under RLS (`auth.uid() = user_id`, no public
 * read) — every read here resolves to an empty result for anonymous
 * visitors rather than throwing; callers gate the *toggle action* behind
 * sign-in (see `toggle()` below and the call sites in BusinessCard /
 * business/[slug].vue), not the read.
 */

export interface FavouriteBusiness extends BusinessListItem {
  favouritedAt: string
}

interface RawFavouriteRow {
  business_id: string
  created_at: string
  businesses: RawBusinessListRow | null
}

/**
 * Shared favourites state + actions for the current user. Every component
 * that calls this (BusinessCard hearts, the business detail save button,
 * /favorites) shares a single underlying fetch: `useAsyncData` dedupes by
 * key, so calling this from many `BusinessCard` instances on one page still
 * only issues one query, and toggling from any one of them updates the
 * reactive `ids` list shared by all the others.
 */
export function useFavourites() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const { data: ids, pending, error, refresh } = useAsyncData(
    () => `favourite-ids:${user.value?.id ?? 'anon'}`,
    async () => {
      if (!user.value) return [] as string[]

      const { data, error } = await supabase
        .from('favourites')
        .select('business_id')
        .eq('user_id', user.value.id)

      if (error) throw error
      return (data ?? []).map(row => row.business_id)
    },
    {
      default: () => [] as string[],
      watch: [() => user.value?.id],
      lazy: true,
    },
  )

  function isFavourited(businessId: string): boolean {
    return ids.value.includes(businessId)
  }

  /**
   * Optimistic toggle: flips the shared `ids` list immediately, then runs
   * the mutation; on failure the flip is rolled back and the error is
   * rethrown (never swallowed) so the caller can surface it. Throws
   * immediately, before any optimistic change, if called while signed out
   * — callers should gate the button itself behind sign-in first.
   */
  async function toggle(businessId: string): Promise<boolean> {
    if (!user.value) throw new Error('You need to be signed in to save favorites.')

    const wasFavourited = ids.value.includes(businessId)
    ids.value = wasFavourited
      ? ids.value.filter(id => id !== businessId)
      : [...ids.value, businessId]

    try {
      const { error } = wasFavourited
        ? await supabase.from('favourites').delete().eq('user_id', user.value.id).eq('business_id', businessId)
        : await supabase.from('favourites').insert({ user_id: user.value.id, business_id: businessId })

      if (error) throw error
      return !wasFavourited
    } catch (mutationError) {
      // Roll back the optimistic flip.
      ids.value = wasFavourited
        ? [...ids.value, businessId]
        : ids.value.filter(id => id !== businessId)
      throw mutationError instanceof Error ? mutationError : new Error('Could not update favorites. Please try again.')
    }
  }

  return { ids, pending, error, refresh, isFavourited, toggle }
}

/**
 * The current user's favourited businesses, joined with business summary
 * data (same shape as `BusinessListItem`) for rendering with `BusinessCard`
 * on `/favorites`. Resolves to an empty list (not an error) when signed out.
 */
export function useMyFavourites() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  return useAsyncData(
    () => `my-favourites:${user.value?.id ?? 'anon'}`,
    async () => {
      if (!user.value) return [] as FavouriteBusiness[]

      const { data, error } = await supabase
        .from('favourites')
        .select(`
          business_id, created_at,
          businesses(
            id, name, slug, description, city, province, avg_rating, review_count, created_at,
            business_categories(categories(id, name, slug, icon)),
            business_images(url, kind, position)
          )
        `)
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })
        .overrideTypes<RawFavouriteRow[], { merge: false }>()

      if (error) throw error

      return (data ?? [])
        .filter((row): row is RawFavouriteRow & { businesses: RawBusinessListRow } => !!row.businesses)
        .map(row => ({
          ...mapListRow(row.businesses),
          favouritedAt: row.created_at,
        }))
    },
    {
      default: () => [] as FavouriteBusiness[],
      watch: [() => user.value?.id],
      lazy: true,
    },
  )
}
