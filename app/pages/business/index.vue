<script setup lang="ts">
// "Zelp for Business" — landing/CTA for owners with no listings yet, or
// the management hub (list + quick links) once they own one or more.
// Protected by `auth` only (not `business-owner`): this is the entry point
// before the visitor owns anything, so there's nothing yet to check
// ownership of.

definePageMeta({
  middleware: 'auth',
})

const { data: businesses, status } = useMyBusinesses()
const pending = computed(() => status.value === 'pending')
const hasBusinesses = computed(() => businesses.value.length > 0)

useSeoMeta({
  title: 'Zelp for Business',
  description: 'List and manage your business on Zelp.',
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-5 py-8">
    <div v-if="pending" class="flex flex-col gap-4">
      <USkeleton class="bg-ink-100 h-8 w-64" />
      <USkeleton class="bg-ink-100 h-24 w-full" />
    </div>

    <template v-else>
      <!-- Management list, shown above the CTA once the owner has at least
           one listing. -->
      <template v-if="hasBusinesses">
        <div class="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 class="text-ink text-2xl font-semibold">
            Your businesses
          </h1>
          <UButton to="/business/new" label="List another business" icon="i-lucide-plus" />
        </div>

        <div class="flex flex-col divide-y divide-line rounded-[18px] border border-line">
          <div v-for="business in businesses" :key="business.id" class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="text-ink font-medium">{{ business.name }}</span>
                <UBadge :label="BUSINESS_STATUS_META[business.status].label" :color="BUSINESS_STATUS_META[business.status].color" variant="subtle" size="sm" />
              </div>
              <RatingStars :rating="business.avgRating" size="xs" show-value :review-count="business.reviewCount" />
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <UButton :to="`/business/edit/${business.id}`" label="Edit" icon="i-lucide-pencil" variant="outline" color="neutral" size="sm" />
              <UButton :to="{ path: '/business/dashboard', query: { business: business.id } }" label="Dashboard" icon="i-lucide-layout-dashboard" variant="outline" color="neutral" size="sm" />
            </div>
          </div>
        </div>
      </template>

      <!-- Marketing CTA — always shown when the owner has zero listings; a
           lighter-weight "add another" prompt otherwise. -->
      <div v-else class="flex flex-col items-center gap-5 py-12 text-center">
        <FlagLine class="w-40" />

        <UIcon name="i-lucide-store" class="text-flame-500 size-10" />

        <div class="flex flex-col gap-2">
          <h1 class="text-ink text-2xl font-semibold">
            List your business on Zelp
          </h1>
          <p class="text-ink-muted max-w-md text-sm">
            Reach customers searching for businesses like yours across Zimbabwe. It takes just a few minutes to get started.
          </p>
        </div>

        <UButton to="/business/new" label="List your business" icon="i-lucide-plus" size="lg" />
      </div>
    </template>
  </div>
</template>
