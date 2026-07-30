<script setup lang="ts">
import type { BusinessListItem } from '~/composables/useBusinesses'

const props = defineProps<{
  business: BusinessListItem
}>()

const user = useSupabaseUser()
const route = useRoute()
const { isFavourited, toggle } = useFavourites()

const favourited = computed(() => isFavourited(props.business.id))
const favError = ref('')
let favErrorTimer: ReturnType<typeof setTimeout> | undefined

// A short scale "pop" on the already-real optimistic toggle in useFavourites
// — pure visual polish, no new logic. Only pulses on save (not un-save),
// matching the reference's `.save.on` treatment.
const justSaved = ref(false)
let pulseTimer: ReturnType<typeof setTimeout> | undefined

// Requires sign-in (redirects to /login, preserving the current page so the
// visitor lands back here) rather than silently failing for anon visitors.
// Once signed in, the toggle itself is optimistic (see useFavourites) with
// a rollback + surfaced error message on failure.
async function handleSaveClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()

  if (!user.value) {
    await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  const wasFavourited = favourited.value
  favError.value = ''
  try {
    await toggle(props.business.id)
    if (!wasFavourited) {
      justSaved.value = true
      clearTimeout(pulseTimer)
      pulseTimer = setTimeout(() => { justSaved.value = false }, 420)
    }
  } catch (error) {
    favError.value = error instanceof Error ? error.message : 'Could not update favorites.'
    clearTimeout(favErrorTimer)
    favErrorTimer = setTimeout(() => { favError.value = '' }, 4000)
  }
}
</script>

<template>
  <ULink :to="`/business/${business.slug}`" class="group zelp-surface flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-floating)]">
    <div class="bg-ink-100 relative aspect-[4/3] w-full overflow-hidden rounded-none">
      <NuxtImg
        v-if="business.coverImageUrl"
        :src="business.coverImageUrl"
        :alt="business.name"
        class="h-full w-full object-cover transition duration-200 group-hover:scale-105"
        loading="lazy"
        width="480"
        height="360"
      />
      <div
        v-else
        class="bg-flame-tint text-flame-300 flex h-full w-full items-center justify-center"
      >
        <UIcon name="i-lucide-store" class="size-10" />
      </div>

      <button
        type="button"
        :aria-label="favourited ? 'Remove from favorites' : 'Save to favorites'"
        :aria-pressed="favourited"
        class="bg-surface/90 text-ink absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full shadow-[var(--shadow-resting)] transition hover:scale-105"
        :class="justSaved ? 'zelp-save-pulse' : ''"
        @click="handleSaveClick"
      >
        <UIcon name="i-lucide-heart" class="size-4" :class="favourited ? 'text-flame-500 fill-current' : ''" />
      </button>

      <span
        v-if="favError"
        class="bg-surface text-closed-500 absolute top-11 right-2.5 z-10 max-w-40 rounded-[10px] p-2 text-right text-xs shadow-[var(--shadow-floating)]"
      >
        {{ favError }}
      </span>
    </div>

    <div class="flex flex-col gap-1.5 p-3.5 pt-1">
      <p v-if="business.categories.length" class="text-ink-faint line-clamp-1 text-[11px] font-semibold tracking-[0.08em] uppercase">
        {{ business.categories.slice(0, 2).map(c => c.name).join(' · ') }}
      </p>
      <div class="flex items-start justify-between gap-2">
        <!-- h2, not h3: this card is used directly under a page's own h1 on
             /search and /favorites (no intervening section h2 there), so h3
             would skip a heading level on those pages. On the homepage,
             where it does sit under a real h2 ("Recently added"), same-level
             siblings are still valid heading order (no level is skipped). -->
        <h2 class="text-ink line-clamp-1 text-base font-medium">
          {{ business.name }}
        </h2>
        <div v-if="business.avgRating > 0" class="text-gold-500 flex shrink-0 items-center gap-1 text-sm">
          <UIcon name="i-lucide-star" class="size-3.5" />
          <span class="text-ink tabular-nums font-medium">{{ business.avgRating.toFixed(1) }}</span>
        </div>
      </div>

      <p class="text-ink-muted line-clamp-1 text-sm">
        <span v-if="business.categories.length">{{ business.categories.slice(0, 2).map(c => c.name).join(', ') }}</span>
        <template v-if="business.categories.length && (business.city || business.province)"> · </template>
        <span v-if="business.city || business.province">{{ [business.city, business.province].filter(Boolean).join(', ') }}</span>
      </p>
    </div>
  </ULink>
</template>
