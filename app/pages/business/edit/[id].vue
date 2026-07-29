<script setup lang="ts">
// Business edit form, pre-filled from the owned business fetched by id.
// `business-owner` middleware has already re-verified ownership server-side
// before this page's script even runs (see app/middleware/business-owner.ts)
// — the `await` below additionally throws a real 404 if the id doesn't
// resolve to a visible row at all, same pattern as business/[slug].vue.

definePageMeta({
  middleware: ['auth', 'business-owner'],
})

const route = useRoute()
const businessId = computed(() => String(route.params.id))

const { data: business, error: fetchError, refresh } = await useOwnedBusiness(businessId)

if (fetchError.value) {
  throw createError({ statusCode: 500, statusMessage: 'Failed to load this business. Please try again.' })
}
if (!business.value) {
  throw createError({ statusCode: 404, statusMessage: 'Business not found', fatal: true })
}

const statusMeta = computed(() => business.value ? BUSINESS_STATUS_META[business.value.status] : null)

// The client can only ever request draft <-> pending — see the
// module-level comment in useOwnedBusinesses.ts. 'published'/'suspended'
// are shown as read-only states with an explanatory note, no controls.
const statusBusy = ref(false)
const statusError = ref('')

async function requestReview() {
  if (!business.value) return
  statusError.value = ''
  statusBusy.value = true
  try {
    await setBusinessStatus(business.value.id, 'pending')
    await refresh()
  } catch (error) {
    statusError.value = error instanceof Error ? error.message : 'Could not update status. Please try again.'
  } finally {
    statusBusy.value = false
  }
}

async function withdrawToDraft() {
  if (!business.value) return
  statusError.value = ''
  statusBusy.value = true
  try {
    await setBusinessStatus(business.value.id, 'draft')
    await refresh()
  } catch (error) {
    statusError.value = error instanceof Error ? error.message : 'Could not update status. Please try again.'
  } finally {
    statusBusy.value = false
  }
}

async function handleSubmitted() {
  await refresh()
  await navigateTo({ path: '/business/dashboard', query: { business: businessId.value } })
}

useSeoMeta({
  title: () => `Edit ${business.value?.name ?? 'business'} — Zelp`,
})
</script>

<template>
  <div v-if="business" class="mx-auto max-w-2xl px-5 py-8">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-ink text-2xl font-semibold">
          Edit {{ business.name }}
        </h1>
        <p class="text-ink-muted mt-1 text-sm">
          Update your listing details below.
        </p>
      </div>
      <UBadge v-if="statusMeta" :label="statusMeta.label" :color="statusMeta.color" variant="subtle" />
    </div>

    <!-- Status control -->
    <section class="border-line mb-8 rounded-[18px] border p-4">
      <h2 class="text-ink mb-1 text-sm font-semibold">
        Listing status
      </h2>

      <template v-if="business.status === 'draft'">
        <p class="text-ink-muted mb-3 text-sm">
          Your listing is a draft and isn't visible to the public yet. When you're ready, request a review to move toward publishing.
        </p>
        <UButton label="Request review" icon="i-lucide-send" :loading="statusBusy" size="sm" @click="requestReview" />
      </template>

      <template v-else-if="business.status === 'pending'">
        <p class="text-ink-muted mb-3 text-sm">
          Your listing is awaiting review before it can be published.
        </p>
        <UButton label="Withdraw to draft" icon="i-lucide-undo-2" variant="outline" color="neutral" :loading="statusBusy" size="sm" @click="withdrawToDraft" />
      </template>

      <template v-else-if="business.status === 'published'">
        <p class="text-ink-muted text-sm">
          Your listing is live and visible to the public.
        </p>
      </template>

      <template v-else>
        <p class="text-ink-muted text-sm">
          Your listing is currently suspended. Contact support for details.
        </p>
      </template>

      <UAlert
        v-if="statusError"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        :description="statusError"
        class="mt-3"
      />
    </section>

    <BusinessForm :existing-business="business" @submitted="handleSubmitted" />
  </div>
</template>
