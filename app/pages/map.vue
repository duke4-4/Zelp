<script setup lang="ts">
// Map view of published businesses (Phase 7) — the /map counterpart to
// /search. Filters (category/rating) and the URL query convention mirror
// search.vue exactly (same query param names) so ListMapToggle's
// query-preserving links actually carry filters across both views.
//
// Unlike /search, there's no separate "total results" fetch here: the
// honest empty state copy required for this page ("No businesses with a
// location set yet") is really just "the map fetch itself returned
// nothing", so it's derived straight from `mapBusinesses` rather than a
// second `useHasAnyBusinesses`-style existence check.

import type { FiltersValue } from '~/components/Filters.vue'
import type { MapBoundsFilter, MapBusinessFilters } from '~/composables/useBusinesses'

// Noindex: a map view has no unique crawlable content of its own -- every
// business pin here is already indexable on its own /business/[slug] page,
// and every filter combination is already indexable via /search. Indexing
// this page too would just be a near-duplicate of /search for crawlers,
// with none of the content actually readable as text (it's a canvas map).
definePageMeta({ robots: false })

const route = useRoute()
const router = useRouter()

const queryString = (key: string): string | undefined => {
  const value = route.query[key]
  return typeof value === 'string' && value ? value : undefined
}

const baseFilters = computed<MapBusinessFilters>(() => {
  const ratingRaw = queryString('rating')
  return {
    q: queryString('q'),
    category: queryString('category'),
    minRating: ratingRaw ? Number(ratingRaw) : undefined,
  }
})

const filtersValue = computed<FiltersValue>(() => ({
  category: baseFilters.value.category,
  minRating: baseFilters.value.minRating,
}))

// "Search this area" scopes the fetch to the map's current viewport on top
// of whatever category/rating filters are active. Any change to the
// category/rating filters (or navigating here fresh) drops back to an
// unbounded, filters-only fetch — an area search is a deliberate, one-shot
// user action, not something that should silently persist across an
// unrelated filter change.
const boundsFilter = ref<MapBoundsFilter | undefined>(undefined)
const hasSearchedArea = ref(false)

const mapFilters = computed<MapBusinessFilters>(() => ({
  ...baseFilters.value,
  bounds: boundsFilter.value,
}))

const { data: mapBusinesses, status } = useMapBusinesses(mapFilters)
const pending = computed(() => status.value === 'pending')

useSeoMeta({
  title: 'Map',
  description: 'Browse Zimbabwean businesses on the map.',
})

function pushQuery(patch: Record<string, string | number | undefined>) {
  const merged: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
    if (Array.isArray(value)) continue
    if (value === undefined || value === null || value === '') continue
    merged[key] = String(value)
  }
  router.push({ path: '/map', query: merged })
}

function handleFiltersUpdate(value: FiltersValue) {
  boundsFilter.value = undefined
  hasSearchedArea.value = false
  pushQuery({ category: value.category, rating: value.minRating })
}

function handleSearchThisArea(bounds: MapBoundsFilter) {
  hasSearchedArea.value = true
  boundsFilter.value = bounds
}

const listHref = computed(() => ({ path: '/search', query: route.query }))

// The interactive map itself is always shown -- Zimbabwe is real and worth
// exploring immediately, it shouldn't wait on businesses adding locations.
// "Nothing to show" only ever surfaces as a small overlay banner on top of
// the live map (via MapView's own emptyBannerMessage), never by hiding the
// map entirely.
const emptyBannerMessage = computed(() => {
  if (pending.value || mapBusinesses.value.length > 0) return null
  return hasSearchedArea.value
    ? 'No businesses with a location in this area yet.'
    : 'No businesses have added their location yet -- explore the map below, or browse the list.'
})
</script>

<template>
  <div class="zelp-container py-6 sm:py-10">
    <div class="mb-6">
      <p class="zelp-kicker mb-1">Explore Zelp</p>
      <h1 class="zelp-section-title mb-4 text-2xl sm:text-3xl">Find a place on the map</h1>
    </div>

    <div class="zelp-surface mb-6 flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <Filters :model-value="filtersValue" @update:model-value="handleFiltersUpdate" />

      <ListMapToggle active="map" :list-to="listHref" :map-to="{ path: '/map', query: route.query }" />
    </div>

    <div class="relative h-[70vh] min-h-[460px] w-full overflow-hidden rounded-[18px] border border-line">
      <MapView
        :businesses="mapBusinesses"
        :pending="pending"
        :empty-banner-message="emptyBannerMessage"
        @search-this-area="handleSearchThisArea"
      />
    </div>
  </div>
</template>
