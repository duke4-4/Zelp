<script setup lang="ts">
// Text search (+ an optional quick city filter) that navigates to /search
// with query params on submit. Used both on the homepage hero and (bound to
// the current query params) at the top of the /search results page itself.

const props = withDefaults(defineProps<{
  modelValue?: string
  initialCity?: string
  placeholder?: string
}>(), {
  modelValue: '',
  initialCity: '',
  placeholder: 'Search businesses, e.g. "plumber" or "salon"',
})

const query = ref(props.modelValue)
const city = ref(props.initialCity)
const route = useRoute()

watch(() => props.modelValue, (value) => { query.value = value ?? '' })
watch(() => props.initialCity, (value) => { city.value = value ?? '' })

function handleSubmit() {
  // Merge onto the current route query (rather than replacing it wholesale)
  // so that submitting a new search term from /search itself doesn't wipe
  // out an already-applied category/rating/sort filter. On the homepage,
  // route.query is empty, so this is equivalent to a fresh query.
  const merged: Record<string, string> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string' && value) merged[key] = value
  }

  const trimmedQuery = query.value.trim()
  const trimmedCity = city.value.trim()
  if (trimmedQuery) merged.q = trimmedQuery
  else delete merged.q
  if (trimmedCity) merged.city = trimmedCity
  else delete merged.city
  // A new search term/city means the previous page number no longer applies.
  delete merged.page

  navigateTo({ path: '/search', query: merged })
}
</script>

<template>
  <form class="flex w-full flex-col gap-2 sm:flex-row" @submit.prevent="handleSubmit">
    <UInput
      v-model="query"
      icon="i-lucide-search"
      size="xl"
      class="flex-1"
      :ui="{ base: 'rounded-full shadow-[var(--shadow-resting)]' }"
      :placeholder="placeholder"
      aria-label="Search businesses"
    />
    <UInput
      v-model="city"
      icon="i-lucide-map-pin"
      size="xl"
      class="sm:w-48"
      :ui="{ base: 'rounded-full shadow-[var(--shadow-resting)]' }"
      placeholder="City (optional)"
      aria-label="City"
    />
    <UButton type="submit" size="xl" label="Search" icon="i-lucide-search" class="justify-center" />
  </form>
</template>
