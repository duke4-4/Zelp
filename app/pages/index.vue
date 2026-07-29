<script setup lang="ts">
// Real homepage: hero + search, browse-by-category, and a "recently added"
// businesses rail. Auth-state UI (signed in as X / log in / sign up) lives
// entirely in Navbar now — this page doesn't duplicate it.

useSeoMeta({
  title: 'Zelp — Discover Zimbabwean Businesses',
  description: 'Find and review trusted businesses across Zimbabwe — restaurants, salons, tradespeople and more, all in one place.',
})

const { data: categories, status: categoriesStatus } = useCategories()
const { data: recentBusinesses, status: recentStatus } = useBusinessList({ sort: 'newest', pageSize: 8 })

const categoriesPending = computed(() => categoriesStatus.value === 'pending')
const recentPending = computed(() => recentStatus.value === 'pending')
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="border-default border-b">
      <div class="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
        <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
          Discover great <span class="text-primary">Zimbabwean businesses</span>
        </h1>
        <p class="text-muted max-w-xl text-lg">
          Search, compare and review restaurants, tradespeople, shops and services near you.
        </p>
        <div class="w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>
    </section>

    <!-- Browse by category -->
    <section class="mx-auto max-w-6xl px-4 py-12">
      <h2 class="mb-6 text-2xl font-bold">
        Browse by category
      </h2>

      <div v-if="categoriesPending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <CategoryCardSkeleton v-for="i in 6" :key="i" />
      </div>

      <EmptyState
        v-else-if="categories.length === 0"
        icon="i-lucide-shapes"
        title="Categories coming soon"
        description="We're still setting up business categories — check back shortly."
      />

      <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <ULink
          v-for="category in categories"
          :key="category.id"
          :to="{ path: '/search', query: { category: category.slug } }"
          class="border-default hover:border-primary/50 flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition hover:shadow-sm"
        >
          <UIcon :name="category.icon || 'i-lucide-shapes'" class="text-primary size-8" />
          <span class="text-sm font-medium">{{ category.name }}</span>
        </ULink>
      </div>
    </section>

    <!-- Recently added businesses -->
    <section class="mx-auto max-w-6xl px-4 py-12">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-2xl font-bold">
          Recently added
        </h2>
        <UButton
          v-if="recentBusinesses.items.length"
          to="/search?sort=newest"
          variant="ghost"
          trailing-icon="i-lucide-arrow-right"
          label="See all"
        />
      </div>

      <div v-if="recentPending" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BusinessCardSkeleton v-for="i in 4" :key="i" />
      </div>

      <EmptyState
        v-else-if="recentBusinesses.items.length === 0"
        icon="i-lucide-store"
        title="No businesses yet"
        description="Zelp is brand new — businesses will start appearing here soon."
      >
        <template #actions>
          <UButton to="/signup" label="Own a business? Sign up" />
        </template>
      </EmptyState>

      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BusinessCard v-for="business in recentBusinesses.items" :key="business.id" :business="business" />
      </div>
    </section>
  </div>
</template>
