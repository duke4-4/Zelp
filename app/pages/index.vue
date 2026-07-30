<script setup lang="ts">
// Real homepage: hero + search, browse-by-category, and a "recently added"
// businesses rail. Auth-state UI (signed in as X / log in / sign up) lives
// entirely in Navbar now — this page doesn't duplicate it.

// Brand-first title on the homepage specifically ("Zelp — tagline" rather
// than the site-wide "Page — Zelp" template every other page uses) --
// overriding the template back to a bare `%s` so it isn't doubled up into
// "Zelp — ... — Zelp".
useHead({ titleTemplate: '%s' })
useSeoMeta({
  title: 'Zelp — Discover Zimbabwean Businesses',
  description: 'Find and review trusted businesses across Zimbabwe — restaurants, salons, tradespeople and more, all in one place.',
})

const { data: categories, status: categoriesStatus, refresh: refreshCategories } = useCategories()
const { data: recentBusinesses, status: recentStatus, refresh: refreshRecent } = useBusinessList({ sort: 'newest', pageSize: 8 })
const { data: mapBusinesses, status: mapStatus } = useMapBusinesses({})

const categoriesPending = computed(() => categoriesStatus.value === 'pending')
const recentPending = computed(() => recentStatus.value === 'pending')
const mapPending = computed(() => mapStatus.value === 'pending')
// `status === 'error'` (not just an empty `data`) is what actually tells a
// genuine "nothing here yet" apart from a failed fetch -- both of these
// composables default to an empty array/result on error (so the page never
// crashes), which would otherwise silently render as an honest-looking
// empty state instead of the real fetch failure it is.
const categoriesErrored = computed(() => categoriesStatus.value === 'error')
const recentErrored = computed(() => recentStatus.value === 'error')
</script>

<template>
  <div>
    <!-- Discovery-first hero: large location-led search over real,
         locally-hosted photography of places across Zimbabwe. -->
    <section class="relative overflow-hidden border-b border-line">
      <HeroSlideshow />
      <div class="relative z-10 mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 text-left sm:py-24">
        <p class="border-stone/60 bg-ink-900/40 rounded-full border px-3 py-1 text-xs font-medium tracking-[0.12em] text-stone uppercase">
          Explore nearby
        </p>
        <h1 class="max-w-2xl text-[34px] leading-[1.06] font-semibold text-white sm:text-5xl">
          The best of your city,<br><span class="text-gold-400">all in one place.</span>
        </h1>
        <p class="max-w-lg text-base leading-7 text-stone/90">
          Find trusted places to eat, shop, stay and get things done across Zimbabwe.
        </p>
        <div class="w-full max-w-3xl">
          <SearchBar />
        </div>
        <div class="flex flex-wrap gap-2 text-sm text-stone">
          <span class="text-stone/75">Popular:</span>
          <ULink to="/search?category=restaurants" class="rounded-full border border-stone/40 px-3 py-1 hover:bg-white/10">Restaurants</ULink>
          <ULink to="/search?category=salons" class="rounded-full border border-stone/40 px-3 py-1 hover:bg-white/10">Salons</ULink>
          <ULink to="/search?category=home-services" class="rounded-full border border-stone/40 px-3 py-1 hover:bg-white/10">Home services</ULink>
        </div>
      </div>
    </section>

    <!-- Browse by category -->
    <section class="zelp-container py-10 sm:py-14">
      <div class="mb-5 flex items-end justify-between gap-4">
        <div>
          <p class="zelp-kicker mb-1">Start exploring</p>
          <h2 class="zelp-section-title">What are you looking for?</h2>
        </div>
        <ULink to="/search" class="text-flame-500 hidden text-sm font-medium sm:block">View all</ULink>
      </div>

      <div v-if="categoriesPending" class="flex gap-4 overflow-x-auto pb-1">
        <CategoryCardSkeleton v-for="i in 6" :key="i" />
      </div>

      <EmptyState
        v-else-if="categoriesErrored"
        icon="i-lucide-alert-triangle"
        title="Couldn't load categories"
        description="Something went wrong loading these. Please try again."
      >
        <template #actions>
          <UButton label="Try again" variant="outline" color="neutral" @click="refreshCategories()" />
        </template>
      </EmptyState>

      <EmptyState
        v-else-if="categories.length === 0"
        icon="i-lucide-shapes"
        title="Categories are on their way"
        description="We're still setting up business categories — check back shortly."
      />

      <div v-else class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        <ULink
          v-for="category in categories"
          :key="category.id"
          :to="{ path: '/search', query: { category: category.slug } }"
          class="group flex flex-col items-center gap-2 text-center"
        >
          <span class="bg-surface text-flame-500 border-line flex size-[68px] items-center justify-center rounded-[22px] border shadow-[var(--shadow-resting)] transition group-hover:-translate-y-0.5 group-hover:border-flame-500">
            <UIcon :name="category.icon || 'i-lucide-shapes'" class="size-6" />
          </span>
          <span class="text-ink text-[11px] leading-[1.2] font-medium tracking-[0.02em] uppercase border-b-2 border-transparent pb-0.5 group-hover:border-flame-500">
            {{ category.name }}
          </span>
        </ULink>
      </div>
    </section>

    <!-- Live map preview: the real interactive map, shown immediately --
         it doesn't wait on businesses to have set a location. -->
    <section class="zelp-container pb-10 sm:pb-14">
      <div class="mb-5 flex items-center justify-between gap-4">
        <div>
          <p class="zelp-kicker mb-1">See it on the map</p>
          <h2 class="zelp-section-title">Explore Zimbabwe</h2>
        </div>
        <UButton to="/map" variant="ghost" trailing-icon="i-lucide-arrow-right" label="Open full map" />
      </div>

      <div class="relative h-72 w-full overflow-hidden rounded-[18px] border border-line sm:h-96">
        <MapView :businesses="mapBusinesses" :pending="mapPending" mode="mini" />
        <UButton
          to="/map"
          label="Open full map"
          icon="i-lucide-maximize-2"
          class="absolute right-4 bottom-4 z-10 shadow-[var(--shadow-floating)]"
        />
      </div>
    </section>

    <!-- Recently added businesses -->
    <section class="zelp-container pb-12 pt-2 sm:pb-16">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <p class="zelp-kicker mb-1">Fresh finds</p>
          <h2 class="zelp-section-title">Recently added</h2>
        </div>
        <UButton
          v-if="recentBusinesses.items.length"
          to="/search?sort=newest"
          variant="ghost"
          trailing-icon="i-lucide-arrow-right"
          label="See all"
        />
      </div>

      <div v-if="recentPending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BusinessCardSkeleton v-for="i in 4" :key="i" />
      </div>

      <EmptyState
        v-else-if="recentErrored"
        icon="i-lucide-alert-triangle"
        title="Couldn't load businesses"
        description="Something went wrong loading these. Please try again."
      >
        <template #actions>
          <UButton label="Try again" variant="outline" color="neutral" @click="refreshRecent()" />
        </template>
      </EmptyState>

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

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BusinessCard v-for="business in recentBusinesses.items" :key="business.id" :business="business" />
      </div>
    </section>
  </div>
</template>
