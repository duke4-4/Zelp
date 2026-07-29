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
    <section class="relative overflow-hidden border-b border-line">
      <HeroSlideshow />
      <div class="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-16 text-center sm:py-24">
        <p class="border-stone/60 bg-ink-900/40 rounded-full border px-3 py-1 text-xs font-medium tracking-[0.12em] text-stone uppercase">
          Find your next local favourite
        </p>
        <h1 class="max-w-2xl text-[32px] leading-[1.1] font-semibold text-white sm:text-4xl">
          Discover great <span class="text-gold-400">Zimbabwean businesses</span>
        </h1>
        <p class="max-w-xl text-base text-stone/90">
          Search, compare and review restaurants, tradespeople, shops and services near you.
        </p>
        <div class="w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>
    </section>

    <!-- Browse by category -->
    <section class="mx-auto max-w-6xl px-5 py-12">
      <h2 class="text-ink mb-5 text-xl font-semibold">
        Browse by category
      </h2>

      <div v-if="categoriesPending" class="flex gap-4 overflow-x-auto pb-1">
        <CategoryCardSkeleton v-for="i in 6" :key="i" />
      </div>

      <EmptyState
        v-else-if="categories.length === 0"
        icon="i-lucide-shapes"
        title="Categories are on their way"
        description="We're still setting up business categories — check back shortly."
      />

      <!-- Category rail: horizontal scroll on all sizes so it reads like a
           rail rather than a dense grid, per the brief's Airbnb-style shell. -->
      <div v-else class="flex snap-x gap-2 overflow-x-auto pb-1">
        <ULink
          v-for="category in categories"
          :key="category.id"
          :to="{ path: '/search', query: { category: category.slug } }"
          class="group flex w-20 shrink-0 snap-start flex-col items-center gap-2 pt-1 pb-2 text-center"
        >
          <span class="bg-stone text-flame-500 border-line flex size-14 items-center justify-center rounded-full border transition group-hover:border-flame-500">
            <UIcon :name="category.icon || 'i-lucide-shapes'" class="size-6" />
          </span>
          <span class="text-ink text-[11px] leading-[1.2] font-medium tracking-[0.02em] uppercase border-b-2 border-transparent pb-0.5 group-hover:border-flame-500">
            {{ category.name }}
          </span>
        </ULink>
      </div>
    </section>

    <!-- Recently added businesses -->
    <section class="mx-auto max-w-6xl px-5 py-12">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-ink text-xl font-semibold">
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
        title="Zelp is brand new — be the first business here"
        description="Businesses will start appearing here as soon as they join."
      >
        <template #actions>
          <UButton to="/signup" label="Own a business? Sign up" />
        </template>
      </EmptyState>

      <div v-else class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <BusinessCard v-for="business in recentBusinesses.items" :key="business.id" :business="business" />
      </div>
    </section>
  </div>
</template>
