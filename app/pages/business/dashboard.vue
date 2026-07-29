<script setup lang="ts">
// Owner dashboard. The required page list only specifies one
// un-parameterized `/business/dashboard` route, so which business it shows
// is resolved here rather than via a route param:
//   - zero owned businesses -> empty state, CTA to /business/new
//   - exactly one -> shown directly, no picking needed
//   - more than one, no `?business=` query -> a selector list
//   - `?business=<id>` given -> shown directly, IF it's actually one of
//     this user's own businesses
//
// That last check is a real ownership check, not just convenience: it's
// membership in `businesses` below, which `useMyBusinesses` already scopes
// to `eq('owner_id', <this user>)` — so a signed-in visitor can't view
// another owner's dashboard stats by guessing `?business=<id>` in the URL,
// even for a published (publicly-visible) business.

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const { data: businesses, status } = useMyBusinesses()
const pending = computed(() => status.value === 'pending')

const requestedId = computed(() => (typeof route.query.business === 'string' ? route.query.business : null))

const selectedBusiness = computed(() => {
  if (requestedId.value) {
    return businesses.value.find(b => b.id === requestedId.value) ?? null
  }
  return businesses.value.length === 1 ? businesses.value[0] : null
})

const needsSelector = computed(() => !selectedBusiness.value && !requestedId.value && businesses.value.length > 1)
const notOwned = computed(() => !!requestedId.value && !selectedBusiness.value && businesses.value.length > 0)

const selectedId = computed(() => selectedBusiness.value?.id ?? '')
const { data: stats, status: statsStatus } = useBusinessDashboardStats(selectedId)
const statsPending = computed(() => statsStatus.value === 'pending')

const statusMeta = computed(() => selectedBusiness.value ? BUSINESS_STATUS_META[selectedBusiness.value.status] : null)

const subscriptionLabel = computed(() => {
  const subStatus = stats.value.subscriptionStatus
  if (!subStatus) return 'No active subscription'
  const labels: Record<string, string> = {
    active: 'Active',
    pending: 'Pending',
    expired: 'Expired',
    cancelled: 'Cancelled',
  }
  return labels[subStatus] ?? subStatus
})

useSeoMeta({
  title: () => selectedBusiness.value ? `${selectedBusiness.value.name} dashboard — Zelp` : 'Business dashboard — Zelp',
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-5 py-8">
    <div v-if="pending" class="flex flex-col gap-4">
      <USkeleton class="bg-ink-100 h-8 w-64" />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <USkeleton v-for="i in 4" :key="i" class="bg-ink-100 h-20 w-full" />
      </div>
    </div>

    <EmptyState
      v-else-if="businesses.length === 0"
      icon="i-lucide-layout-dashboard"
      title="You don't own any businesses yet"
      description="List your business on Zelp to see its dashboard here."
    >
      <template #actions>
        <UButton to="/business/new" label="List your business" />
      </template>
    </EmptyState>

    <div v-else-if="notOwned" class="flex flex-col items-center gap-3 py-16 text-center">
      <UIcon name="i-lucide-shield-alert" class="text-ink-faint size-8" />
      <p class="text-ink text-base font-medium">
        That business isn't yours to view
      </p>
      <UButton to="/business" label="Back to your businesses" variant="outline" color="neutral" />
    </div>

    <div v-else-if="needsSelector" class="flex flex-col gap-4">
      <h1 class="text-ink text-2xl font-semibold">
        Choose a business
      </h1>
      <div class="flex flex-col divide-y divide-line rounded-[18px] border border-line">
        <ULink
          v-for="business in businesses"
          :key="business.id"
          :to="{ path: '/business/dashboard', query: { business: business.id } }"
          class="hover:bg-ink-50 flex items-center justify-between gap-3 p-4"
        >
          <span class="text-ink font-medium">{{ business.name }}</span>
          <UBadge :label="BUSINESS_STATUS_META[business.status].label" :color="BUSINESS_STATUS_META[business.status].color" variant="subtle" size="sm" />
        </ULink>
      </div>
    </div>

    <template v-else-if="selectedBusiness">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-ink text-2xl font-semibold">
            {{ selectedBusiness.name }}
          </h1>
          <UBadge v-if="statusMeta" :label="statusMeta.label" :color="statusMeta.color" variant="subtle" class="mt-1" />
        </div>
        <div class="flex items-center gap-2">
          <UButton v-if="businesses.length > 1" to="/business/dashboard" label="Switch business" variant="ghost" color="neutral" size="sm" />
          <UButton :to="`/business/edit/${selectedBusiness.id}`" label="Edit listing" icon="i-lucide-pencil" variant="outline" color="neutral" size="sm" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-[18px] border border-line p-4">
          <p class="text-ink-faint text-xs font-medium tracking-wide uppercase">
            Views
          </p>
          <p class="text-ink mt-1 text-2xl font-semibold tabular-nums">
            <USkeleton v-if="statsPending" class="bg-ink-100 h-7 w-12" />
            <template v-else>{{ stats.viewCount }}</template>
          </p>
        </div>

        <div class="rounded-[18px] border border-line p-4">
          <p class="text-ink-faint text-xs font-medium tracking-wide uppercase">
            Reviews
          </p>
          <p class="text-ink mt-1 text-2xl font-semibold tabular-nums">
            {{ selectedBusiness.reviewCount }}
          </p>
        </div>

        <div class="rounded-[18px] border border-line p-4">
          <p class="text-ink-faint text-xs font-medium tracking-wide uppercase">
            Avg rating
          </p>
          <div class="mt-1.5">
            <RatingStars :rating="selectedBusiness.avgRating" size="sm" show-value />
          </div>
        </div>

        <div class="rounded-[18px] border border-line p-4">
          <p class="text-ink-faint text-xs font-medium tracking-wide uppercase">
            Subscription
          </p>
          <p class="text-ink mt-1 text-sm font-medium">
            <USkeleton v-if="statsPending" class="bg-ink-100 h-5 w-20" />
            <template v-else>{{ subscriptionLabel }}</template>
          </p>
        </div>
      </div>

      <p v-if="selectedBusiness.status === 'draft' || selectedBusiness.status === 'pending'" class="text-ink-muted mt-6 text-sm">
        This listing isn't public yet.
        <ULink :to="`/business/edit/${selectedBusiness.id}`" class="text-flame-500 font-medium">
          Manage its status from the edit page.
        </ULink>
      </p>
    </template>
  </div>
</template>
