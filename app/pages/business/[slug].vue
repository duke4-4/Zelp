<script setup lang="ts">
// Business detail page.
//
// Note on loading state: unlike the homepage/search (which use lazy
// fetching + a skeleton), this page `await`s its data directly in `setup`
// so Nuxt blocks SSR until the business is resolved. That's required to
// throw a real HTTP 404 (correct status code for crawlers/bots) when the
// slug doesn't exist or isn't visible under RLS — a `lazy: true` fetch
// would have already sent a 200 response with a skeleton before the
// "not found" state was known. The trade-off is no skeleton flash here;
// the page is either fully rendered or a proper 404.

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: business, error: fetchError } = await useBusinessDetail(slug)

if (fetchError.value) {
  throw createError({ statusCode: 500, statusMessage: 'Failed to load this business. Please try again.' })
}
if (!business.value) {
  throw createError({ statusCode: 404, statusMessage: 'Business not found', fatal: true })
}

const contactLinks = computed(() => {
  const b = business.value!
  return {
    phone: b.phone,
    whatsapp: b.whatsapp,
    email: b.email,
    website: b.website,
  }
})
const hasContactInfo = computed(() => Object.values(contactLinks.value).some(Boolean))

const locationLine = computed(() => {
  const b = business.value!
  return [b.address, b.city, b.province].filter(Boolean).join(', ')
})

const hoursEntries = computed(() => {
  const hours = business.value?.hours
  if (!hours || typeof hours !== 'object') return []
  return Object.entries(hours as Record<string, unknown>)
})

function formatDayLabel(day: string): string {
  return day.length ? day.charAt(0).toUpperCase() + day.slice(1) : day
}

function formatHoursValue(value: unknown): string {
  if (value && typeof value === 'object') {
    const range = value as Record<string, unknown>
    if (typeof range.open === 'string' && typeof range.close === 'string') {
      return `${range.open} – ${range.close}`
    }
  }
  if (typeof value === 'string' && value) return value
  return 'Closed'
}

function normalizeWhatsappHref(value: string): string {
  return `https://wa.me/${value.replace(/[^\d]/g, '')}`
}

// Directions isn't a stored contact field — it's a Google Maps deep link
// built from the address/city/province already fetched for the header, so
// it's presentation only (no new data usage).
const directionsHref = computed(() => locationLine.value
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLine.value)}`
  : null)

const actionRow = computed(() => {
  const b = business.value
  if (!b) return []
  return [
    directionsHref.value && { label: 'Directions', icon: 'i-lucide-navigation', href: directionsHref.value, external: true },
    b.phone && { label: 'Call', icon: 'i-lucide-phone', href: `tel:${b.phone}` },
    b.whatsapp && { label: 'WhatsApp', icon: 'i-lucide-message-circle', href: normalizeWhatsappHref(b.whatsapp), external: true },
    b.website && { label: 'Website', icon: 'i-lucide-globe', href: b.website, external: true },
  ].filter((item): item is { label: string, icon: string, href: string, external?: boolean } => Boolean(item))
})

onMounted(() => {
  if (business.value) recordBusinessView(business.value.id)
})

useSeoMeta({
  title: () => `${business.value?.name ?? 'Business'} — Zelp`,
  description: () => business.value?.description || `${business.value?.name} on Zelp — Zimbabwean business directory.`,
})
</script>

<template>
  <div v-if="business" class="mx-auto max-w-5xl px-5 py-8">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <h1 class="text-ink text-[28px] leading-[1.15] font-semibold sm:text-[32px]">
          {{ business.name }}
        </h1>
      </div>

      <div v-if="business.categories.length" class="flex flex-wrap gap-1.5">
        <UBadge
          v-for="category in business.categories"
          :key="category.id"
          :label="category.name"
          variant="subtle"
          color="neutral"
        />
      </div>

      <RatingStars :rating="business.avgRating" size="md" show-value :review-count="business.reviewCount" />

      <p v-if="locationLine" class="text-ink-muted flex items-center gap-1.5 text-sm">
        <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
        {{ locationLine }}
      </p>
    </div>

    <!-- Contact action row -->
    <div v-if="actionRow.length" class="mb-8 flex flex-wrap gap-2">
      <UButton
        v-for="action in actionRow"
        :key="action.label"
        :to="action.href"
        :target="action.external ? '_blank' : undefined"
        :rel="action.external ? 'noopener noreferrer' : undefined"
        :icon="action.icon"
        :label="action.label"
        variant="outline"
        color="neutral"
        size="lg"
      />
    </div>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div class="flex flex-col gap-8 md:col-span-2">
        <!-- Photos -->
        <section>
          <h2 class="text-ink mb-3 text-lg font-semibold">
            Photos
          </h2>
          <ImageGallery :images="business.images" :business-name="business.name" />
        </section>

        <!-- Description -->
        <section v-if="business.description">
          <h2 class="text-ink mb-2 text-lg font-semibold">
            About
          </h2>
          <p class="text-ink-muted whitespace-pre-line">
            {{ business.description }}
          </p>
        </section>

        <!-- Chevron frieze divider — the second of the three sanctioned
             uses of the brand pattern (docs/zelp-brand-guidelines.md). -->
        <div class="h-6 w-full overflow-hidden rounded-full" aria-hidden="true">
          <img
            src="/brand/zelp-pattern-chevron.svg"
            alt=""
            class="h-full w-full object-cover"
          >
        </div>

        <!--
          Phase 4 hook: ReviewCard / ReviewForm / RatingStars(interactive)
          render here, backed by the `reviews` table. `avgRating` and
          `reviewCount` above already come from `businesses.avg_rating` /
          `review_count`, which Phase 1's `update_business_rating()` trigger
          keeps in sync — no extra fetch needed once review UI lands.
        -->
        <section>
          <h2 class="text-ink mb-2 text-lg font-semibold">
            Reviews ({{ business.reviewCount }})
          </h2>
          <p class="text-ink-muted text-sm">
            Review submission is coming soon.
          </p>
        </section>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Contact -->
        <section v-if="hasContactInfo" class="rounded-[18px] border border-line p-4">
          <h2 class="text-ink mb-3 text-lg font-semibold">
            Contact
          </h2>
          <div class="flex flex-col gap-2.5 text-sm">
            <a v-if="contactLinks.phone" :href="`tel:${contactLinks.phone}`" class="text-ink-muted hover:text-flame-500 flex items-center gap-2">
              <UIcon name="i-lucide-phone" class="size-4 shrink-0" />
              {{ contactLinks.phone }}
            </a>
            <a
              v-if="contactLinks.whatsapp"
              :href="normalizeWhatsappHref(contactLinks.whatsapp)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-ink-muted hover:text-flame-500 flex items-center gap-2"
            >
              <UIcon name="i-lucide-message-circle" class="size-4 shrink-0" />
              WhatsApp
            </a>
            <a v-if="contactLinks.email" :href="`mailto:${contactLinks.email}`" class="text-ink-muted hover:text-flame-500 flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="size-4 shrink-0" />
              {{ contactLinks.email }}
            </a>
            <a
              v-if="contactLinks.website"
              :href="contactLinks.website"
              target="_blank"
              rel="noopener noreferrer"
              class="text-ink-muted hover:text-flame-500 flex items-center gap-2"
            >
              <UIcon name="i-lucide-globe" class="size-4 shrink-0" />
              <span class="truncate">{{ contactLinks.website }}</span>
            </a>
          </div>
        </section>

        <!-- Hours -->
        <section v-if="hoursEntries.length" class="rounded-[18px] border border-line p-4">
          <h2 class="text-ink mb-3 text-lg font-semibold">
            Hours
          </h2>
          <dl class="flex flex-col gap-1.5 text-sm">
            <div v-for="[day, value] in hoursEntries" :key="day" class="flex justify-between gap-4">
              <dt class="text-ink-muted">
                {{ formatDayLabel(day) }}
              </dt>
              <dd class="text-ink tabular-nums">
                {{ formatHoursValue(value) }}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </div>
</template>
