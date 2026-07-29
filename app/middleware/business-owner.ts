import type { Database } from '~~/types/database.types'

/**
 * Protects owner-only business routes (`/business/edit/[id]`): verifies
 * the signed-in user actually owns the business at `to.params.id` by
 * re-fetching it from the DB and comparing `owner_id` — not just hiding a
 * link in the UI. Implies the `auth` check too (redirects anonymous
 * visitors to `/login` first, same as the `auth` middleware), so a route
 * only needs `middleware: ['auth', 'business-owner']` or just
 * `'business-owner'` alone; either is safe.
 *
 * Note this re-fetch is intentionally independent of any list already in
 * memory (e.g. `useMyBusinesses`) — this must hold even if the caller
 * lands here directly (bookmarked URL, typed-in id) without that list ever
 * having been fetched this session.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  const businessId = String(to.params.id ?? '')
  if (!businessId) {
    return navigateTo('/business')
  }

  const supabase = useSupabaseClient<Database>()
  const { data, error } = await supabase
    .from('businesses')
    .select('id, owner_id')
    .eq('id', businessId)
    .maybeSingle()

  // Not found, not visible under RLS, or a real fetch error — either way,
  // this caller doesn't get to proceed as if they own it.
  if (error || !data || data.owner_id !== user.value.id) {
    return navigateTo('/business')
  }
})
