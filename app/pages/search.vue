<script setup lang="ts">
import type { BusinessListFilters } from '~/composables/useBusinesses'
import type { FiltersValue } from '~/components/Filters.vue'

const route = useRoute()
const router = useRouter()

const queryString = (key: string): string | undefined => {
  const value = route.query[key]
  return typeof value === 'string' && value ? value : undefined
}

const filters = computed<BusinessListFilters>(() => {
  const ratingRaw = queryString('rating')
  const pageRaw = queryString('page')
  return {
    q: queryString('q'),
    category: queryString('category'),
    city: queryString('city'),
    province: queryString('province'),
    minRating: ratingRaw ? Number(ratingRaw) : undefined,
    sort: queryString('sort') === 'rating' ? 'rating' : 'newest',
    page: pageRaw ? Number(pageRaw) : 1,
    pageSize: 12,
  }
})

const filtersValue = computed<FiltersValue>(() => ({
  category: filters.value.category,
  minRating: filters.value.minRating,
  sort: filters.value.sort,
}))

const { data: results, status } = useBusinessList(filters)
const { data: hasAnyBusinesses } = useHasAnyBusinesses()
const pending = computed(() => status.value === 'pending')

useSeoMeta({
  title: () => filters.value.q ? `"${filters.value.q}" — Search — Zelp` : 'Search businesses — Zelp',
  description: 'Search Zimbabwean businesses by name, category, city or rating.',
})

/** Merges a patch onto the current route query, dropping empty/undefined values. */
function pushQuery(patch: Record<string, string | number | undefined>) {
  const merged: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
    if (Array.isArray(value)) continue
    if (value === undefined || value === null || value === '') continue
    merged[key] = String(value)
  }
  router.push({ path: '/search', query: merged })
}

function handleFiltersUpdate(value: FiltersValue) {
  // Any filter change invalidates the current page number.
  pushQuery({ category: value.category, rating: value.minRating, sort: value.sort, page: undefined })
}

function handlePageChange(page: number) {
  pushQuery({ page })
}

const emptyStateCopy = computed(() => {
  if (!hasAnyBusinesses.value) {
    return {
      title: 'Zelp is brand new — be the first business here',
      description: 'Businesses will start appearing here as soon as they join.',
    }
  }
  return {
    title: 'No matches yet',
    description: 'Try a different search term, or adjust your filters.',
  }
})
</script>

<template>
  <div class="zelp-container py-6 sm:py-10">
    <div class="mb-6">
      <p class="zelp-kicker mb-1">Explore Zelp</p>
      <h1 class="zelp-section-title mb-4 text-2xl sm:text-3xl">Find a place you’ll love</h1>
      <SearchBar :model-value="filters.q" :initial-city="filters.city" />
    </div>

    <div class="zelp-surface mb-6 flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <Filters :model-value="filtersValue" @update:model-value="handleFiltersUpdate" />

      <!-- Placeholder list/map toggle — inert, Phase 7 wires the actual map. -->
      <div class="border-line bg-surface flex shrink-0 items-center gap-0.5 rounded-full border p-0.5" role="group" aria-label="View">
        <span class="bg-flame-tint text-flame-500 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium">
          <UIcon name="i-lucide-list" class="size-4" />
          List
        </span>
        <span
          class="text-ink-faint flex cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
          aria-disabled="true"
          title="Map view is coming soon"
        >
          <UIcon name="i-lucide-map" class="size-4" />
          Map
        </span>
      </div>
    </div>

    <p class="text-ink-faint tabular-nums mb-4 text-sm">
      <template v-if="!pending">
        {{ results.total }} business{{ results.total === 1 ? '' : 'es' }} found
      </template>
    </p>

    <div v-if="pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <BusinessCardSkeleton v-for="i in 6" :key="i" />
    </div>

    <EmptyState
      v-else-if="results.items.length === 0"
      icon="i-lucide-search-x"
      v-bind="emptyStateCopy"
    />

    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BusinessCard v-for="business in results.items" :key="business.id" :business="business" />
      </div>

      <div class="mt-8 flex justify-center">
        <Pagination
          :page="results.page"
          :total="results.total"
          :page-size="results.pageSize"
          @update:page="handlePageChange"
        />
      </div>
    </template>
  </div>
</template>
