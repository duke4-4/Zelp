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

// --- Views chart: real `business_views` rows grouped by day (see
// useBusinessDashboardStats), rendered as a small inline sparkline on the
// stat card plus a bigger day-by-day bar chart below. Both must degrade to
// an honest flat/zero state rather than imply activity that didn't happen.
const viewCounts = computed(() => stats.value.viewsLast7Days.map(d => d.count))
const hasAnyRecentViews = computed(() => viewCounts.value.some(v => v > 0))

const sparklinePoints = computed(() => {
  const vals = viewCounts.value
  if (vals.length < 2) return ''
  const w = 100
  const h = 26
  const mx = Math.max(...vals)
  const mn = Math.min(...vals)
  const range = (mx - mn) || 1
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w
      const y = h - 2 - ((v - mn) / range) * (h - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

function barHeightPx(count: number): string {
  const mx = Math.max(...viewCounts.value)
  if (mx <= 0) return '6px'
  return `${Math.max(6, (count / mx) * 118)}px`
}

// --- "Needs your attention": only real, derivable conditions — never
// invented/unverifiable nudges. Each links straight to where it's fixed.
interface AttentionItem {
  key: string
  title: string
  description: string
  actionLabel: string
  to: string
}

const attentionItems = computed<AttentionItem[]>(() => {
  const business = selectedBusiness.value
  if (!business) return []
  const items: AttentionItem[] = []

  if (business.reviewCount === 0) {
    items.push({
      key: 'no-reviews',
      title: 'No reviews yet',
      description: 'New listings take a little time to earn their first review — share your Zelp page with customers.',
      actionLabel: 'View listing',
      to: `/business/${business.slug}`,
    })
  }

  if (!business.description || !business.description.trim()) {
    items.push({
      key: 'no-description',
      title: 'Your description is empty',
      description: 'A short description helps people decide to visit before they even see a review.',
      actionLabel: 'Add one',
      to: `/business/edit/${business.id}`,
    })
  }

  return items
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
        <div class="zelp-surface p-4">
          <p class="text-ink-faint text-[11px] font-semibold tracking-[0.06em] uppercase">
            Views
          </p>
          <p class="text-ink mt-1 text-2xl font-semibold tabular-nums">
            <USkeleton v-if="statsPending" class="bg-ink-100 h-7 w-12" />
            <template v-else>{{ stats.viewCount }}</template>
          </p>
          <svg
            v-if="!statsPending && sparklinePoints"
            class="text-flame-400 mt-2 h-6 w-full"
            viewBox="0 0 100 26"
            preserveAspectRatio="none"
            role="img"
            aria-label="Views over the last 7 days"
          >
            <polyline :points="sparklinePoints" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <div class="zelp-surface p-4">
          <p class="text-ink-faint text-[11px] font-semibold tracking-[0.06em] uppercase">
            Reviews
          </p>
          <p class="text-ink mt-1 text-2xl font-semibold tabular-nums">
            {{ selectedBusiness.reviewCount }}
          </p>
        </div>

        <div class="zelp-surface p-4">
          <p class="text-ink-faint text-[11px] font-semibold tracking-[0.06em] uppercase">
            Avg rating
          </p>
          <div class="mt-1.5">
            <RatingStars :rating="selectedBusiness.avgRating" size="sm" show-value />
          </div>
        </div>

        <div class="zelp-surface p-4">
          <p class="text-ink-faint text-[11px] font-semibold tracking-[0.06em] uppercase">
            Subscription
          </p>
          <p class="text-ink mt-1 text-sm font-medium">
            <USkeleton v-if="statsPending" class="bg-ink-100 h-5 w-20" />
            <template v-else>{{ subscriptionLabel }}</template>
          </p>
        </div>
      </div>

      <!-- Profile views — real business_views rows grouped by day, an
           honest flat/zero state when there's no view history yet. -->
      <div class="zelp-surface mt-6 p-5">
        <div class="mb-4 flex items-baseline justify-between gap-3">
          <h2 class="text-ink text-base font-semibold">
            Profile views
          </h2>
          <span class="text-ink-faint text-xs">Last 7 days</span>
        </div>

        <div v-if="statsPending" class="flex h-[140px] items-end gap-3">
          <USkeleton v-for="i in 7" :key="i" class="bg-ink-100 h-full w-full" />
        </div>

        <template v-else>
          <div class="flex h-[140px] items-end gap-2 sm:gap-3">
            <div v-for="day in stats.viewsLast7Days" :key="day.date" class="flex flex-1 flex-col items-center gap-1.5">
              <span class="text-ink-faint text-[11px] tabular-nums">{{ day.count }}</span>
              <div
                class="w-full rounded-t-[6px]"
                :class="hasAnyRecentViews ? 'bg-flame-400' : 'bg-ink-100'"
                :style="{ height: barHeightPx(day.count) }"
              />
              <span class="text-ink-faint text-[11px] uppercase">{{ day.label }}</span>
            </div>
          </div>
          <p v-if="!hasAnyRecentViews" class="text-ink-faint mt-3 text-center text-xs">
            Not enough data yet
          </p>
        </template>
      </div>

      <!-- Needs your attention — only real, derivable nudges. -->
      <div v-if="!statsPending && attentionItems.length" class="mt-8">
        <h2 class="text-ink mb-3 text-base font-semibold">
          Needs your attention
        </h2>
        <div class="flex flex-col gap-2">
          <div v-for="item in attentionItems" :key="item.key" class="zelp-surface flex items-start gap-3 p-3.5">
            <span class="bg-flame-500 mt-1.5 size-2 shrink-0 rounded-full" aria-hidden="true" />
            <div class="flex-1">
              <p class="text-ink text-sm font-medium">
                {{ item.title }}
              </p>
              <p class="text-ink-muted text-xs">
                {{ item.description }}
              </p>
            </div>
            <UButton :to="item.to" :label="item.actionLabel" variant="ghost" color="neutral" size="xs" class="shrink-0" />
          </div>
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
