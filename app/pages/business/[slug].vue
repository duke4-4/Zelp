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
const user = useSupabaseUser()

const { data: business, error: fetchError, refresh: refreshBusiness } = await useBusinessDetail(slug)

if (fetchError.value) {
  throw createError({ statusCode: 500, statusMessage: 'Failed to load this business. Please try again.' })
}
if (!business.value) {
  throw createError({ statusCode: 404, statusMessage: 'Business not found', fatal: true })
}

// Owners can't review their own business (enforced at the DB/RLS level
// too) — the write-a-review form is simply never shown to them, rather
// than letting them submit and hit a policy-violation error.
const isOwner = computed(() => !!user.value && user.value.id === business.value?.owner?.id)

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

// --- Favourites (save button) ---

const { isFavourited, toggle: toggleFavourite } = useFavourites()
const favourited = computed(() => !!business.value && isFavourited(business.value.id))
const favBusy = ref(false)
const favError = ref('')

async function handleToggleFavourite() {
  if (!business.value) return
  if (!user.value) {
    await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  favError.value = ''
  favBusy.value = true
  try {
    await toggleFavourite(business.value.id)
  } catch (error) {
    favError.value = error instanceof Error ? error.message : 'Could not update favorites. Please try again.'
  } finally {
    favBusy.value = false
  }
}

// --- Reviews ---
// The reviews list and the caller's own review are two independent fetches
// (see useReviews.ts): `myReview` decides which state the write/edit
// affordance is in, `reviewsResult` is the full paginated list rendered via
// ReviewCard (which — including for the caller's own review, if it's on
// the current page — carries its own inline Edit/Delete; there's no
// separate "your review" panel duplicating that here).

const reviewsPage = ref(1)
const { data: reviewsResult, status: reviewsStatus, refresh: refreshReviews } = useBusinessReviews(
  () => business.value?.id ?? '',
  reviewsPage,
)
const { data: myReview, refresh: refreshMyReview } = useMyReview(() => business.value?.id ?? '')
const reviewsPending = computed(() => reviewsStatus.value === 'pending')

async function refreshReviewData() {
  await Promise.all([refreshReviews(), refreshMyReview(), refreshBusiness()])
}

function handleReviewChange() {
  void refreshReviewData()
}

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

        <div class="flex flex-col items-end gap-1">
          <UButton
            :icon="favourited ? 'i-lucide-heart' : 'i-lucide-heart'"
            :label="favourited ? 'Saved' : 'Save'"
            :color="favourited ? 'primary' : 'neutral'"
            :variant="favourited ? 'subtle' : 'outline'"
            :loading="favBusy"
            :ui="{ leadingIcon: favourited ? 'fill-current' : '' }"
            @click="handleToggleFavourite"
          />
          <span v-if="favError" class="text-closed-500 max-w-48 text-right text-xs">{{ favError }}</span>
        </div>
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

        <BrandStripe />

        <!--
          `avgRating` / `reviewCount` above already come from
          `businesses.avg_rating` / `review_count`, which the
          `update_business_rating()` trigger keeps in sync on every review
          insert/update/delete — `refreshBusiness()` after a mutation is
          all that's needed to pick up the new aggregate, no separate
          computation here.
        -->
        <section>
          <h2 class="text-ink mb-4 text-lg font-semibold">
            Reviews ({{ business.reviewCount }})
          </h2>

          <!-- Write / edit / sign-in prompt. Deliberately not shown at all
               to the owner (self-review is blocked at the DB level, but we
               don't let them reach that error in the first place). When the
               caller already has a review, no second form is shown here —
               it appears (via ReviewCard's own Edit toggle, in the list
               below) so it isn't duplicated on screen. -->
          <div v-if="!user" class="border-line mb-6 rounded-[18px] border p-4 text-center">
            <p class="text-ink-muted mb-3 text-sm">
              Sign in to share your experience with this business.
            </p>
            <UButton
              label="Sign in to write a review"
              :to="{ path: '/login', query: { redirect: route.fullPath } }"
            />
          </div>
          <div v-else-if="!isOwner && !myReview" class="mb-6">
            <ReviewForm :business-id="business.id" @submitted="handleReviewChange" />
          </div>

          <div v-if="reviewsPending" class="flex flex-col divide-y divide-line">
            <div v-for="i in 3" :key="i" class="flex items-center gap-3 py-5">
              <USkeleton class="bg-ink-100 size-10 shrink-0 rounded-full" />
              <div class="flex flex-1 flex-col gap-1.5">
                <USkeleton class="bg-ink-100 h-3.5 w-32" />
                <USkeleton class="bg-ink-100 h-3 w-20" />
              </div>
            </div>
          </div>

          <EmptyState
            v-else-if="!reviewsResult.items.length"
            icon="i-lucide-message-square"
            title="No reviews yet"
            description="Be the first to share your experience with this business."
          />

          <template v-else>
            <div class="flex flex-col divide-y divide-line">
              <ReviewCard
                v-for="item in reviewsResult.items"
                :key="item.id"
                :review="item"
                @updated="handleReviewChange"
                @deleted="handleReviewChange"
              />
            </div>

            <div class="mt-4 flex justify-center">
              <Pagination
                :page="reviewsResult.page"
                :total="reviewsResult.total"
                :page-size="reviewsResult.pageSize"
                @update:page="(page) => (reviewsPage = page)"
              />
            </div>
          </template>
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
