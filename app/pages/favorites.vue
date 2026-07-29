<script setup lang="ts">
// Matches the Navbar's `/favorites` link (American spelling in the URL,
// per the original required page list) even though the DB table and the
// rest of this file use "favourite(s)" per the project's own vocabulary.

definePageMeta({
  middleware: 'auth',
})

const { data: favourites, status } = useMyFavourites()
const pending = computed(() => status.value === 'pending')

useSeoMeta({
  title: 'Your favorites — Zelp',
  description: 'Businesses you\'ve saved on Zelp.',
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-8">
    <h1 class="text-ink mb-6 text-2xl font-semibold">
      Your favorites
    </h1>

    <div v-if="pending" class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      <BusinessCardSkeleton v-for="i in 6" :key="i" />
    </div>

    <EmptyState
      v-else-if="favourites.length === 0"
      icon="i-lucide-heart"
      title="You haven't saved anywhere yet"
      description="Tap the heart on a business to save it here for later."
    >
      <template #actions>
        <UButton to="/search" label="Explore businesses" />
      </template>
    </EmptyState>

    <div v-else class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      <BusinessCard v-for="business in favourites" :key="business.id" :business="business" />
    </div>
  </div>
</template>
