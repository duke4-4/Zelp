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
      title: 'No businesses on Zelp yet',
      description: 'Zelp is brand new — businesses will start appearing here soon.',
    }
  }
  return {
    title: 'No results found',
    description: 'Try a different search term, or adjust your filters.',
  }
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <div class="mb-6">
      <SearchBar :model-value="filters.q" :initial-city="filters.city" />
    </div>

    <div class="mb-6">
      <Filters :model-value="filtersValue" @update:model-value="handleFiltersUpdate" />
    </div>

    <p class="text-muted mb-4 text-sm">
      <template v-if="!pending">
        {{ results.total }} business{{ results.total === 1 ? '' : 'es' }} found
      </template>
    </p>

    <div v-if="pending" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <BusinessCardSkeleton v-for="i in 6" :key="i" />
    </div>

    <EmptyState
      v-else-if="results.items.length === 0"
      icon="i-lucide-search-x"
      v-bind="emptyStateCopy"
    />

    <template v-else>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
