// Dynamic sitemap source for @nuxtjs/sitemap: any handler under
// server/api/__sitemap__/ is auto-discovered and its returned URLs merged
// into the site's sitemap.xml alongside the static app routes.
//
// This adds one <url> per real, published business (/business/[slug]) --
// fetched straight from Supabase, scoped to `status = 'published'` so
// draft/pending/suspended listings (which 404 or are owner-only) never
// appear in a public sitemap. If there are zero published businesses yet,
// this simply returns an empty array and the sitemap falls back to just
// the static routes -- that's correct, not a bug to work around.
//
// Uses the anon-context server client (RLS already scopes `businesses` to
// published-or-own rows for an unauthenticated request), matching the same
// data-access pattern as the client-side composables in
// app/composables/useBusinesses.ts.

import type { SitemapUrlInput } from '#sitemap/types'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~~/types/database.types'

interface PublishedBusinessRow {
  slug: string
  updated_at: string | null
  created_at: string
}

export default defineSitemapEventHandler(async (event) => {
  // Wrapped in try/catch (not just the `{ data, error }` check below) since
  // client construction itself can throw -- e.g. this handler 500s outright
  // on this dev machine's Node 20 (see the module-level comment above about
  // the unrelated, already-known Supabase/WebSocket gap). Either way, a
  // broken sitemap source should degrade to "no extra URLs this run", never
  // take down the whole sitemap.
  try {
    const supabase = await serverSupabaseClient<Database>(event)

    const { data, error } = await supabase
      .from('businesses')
      .select('slug, updated_at, created_at')
      .eq('status', 'published')
      .returns<PublishedBusinessRow[]>()

    if (error) throw error

    return (data ?? []).map((business): SitemapUrlInput => ({
      loc: `/business/${business.slug}`,
      lastmod: business.updated_at ?? business.created_at,
      // Individual listings change more often than the static marketing
      // pages but aren't updated by the minute -- a weekly crawl hint is a
      // reasonable, honest default (not a guarantee, just a hint to crawlers).
      changefreq: 'weekly',
    }))
  } catch (error) {
    console.error('[sitemap] Failed to fetch published businesses:', error instanceof Error ? error.message : error)
    return []
  }
})
