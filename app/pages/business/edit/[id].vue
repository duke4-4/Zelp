<script setup lang="ts">
// Business edit form, pre-filled from the owned business fetched by id.
// `business-owner` middleware has already re-verified ownership server-side
// before this page's script even runs (see app/middleware/business-owner.ts)
// — the `await` below additionally throws a real 404 if the id doesn't
// resolve to a visible row at all, same pattern as business/[slug].vue.

import type { UploadResult } from '~/composables/useUpload'

definePageMeta({
  middleware: ['auth', 'business-owner'],
  robots: false,
})

const route = useRoute()
const toast = useToast()
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
  // Toast rather than this page's own inline UAlert pattern (same reasoning
  // as business/new.vue): the confirmation needs to outlive the navigation
  // below.
  toast.add({ title: 'Business updated', color: 'success', icon: 'i-lucide-check-circle' })
  await navigateTo({ path: '/business/dashboard', query: { business: businessId.value } })
}

// --- Photos (Phase 6) -------------------------------------------------
// Every mutation here writes straight to `business_images` (via
// useBusinessImages.ts) and then `refresh()`es the owned-business fetch,
// same pattern as the status controls above — there's no separate "save"
// step for photos, each upload/remove takes effect immediately.

const logoImage = computed(() => business.value?.images.find(img => img.kind === 'logo') ?? null)
const coverImage = computed(() => business.value?.images.find(img => img.kind === 'cover') ?? null)
const galleryImages = computed(() => business.value?.images.filter(img => img.kind === 'gallery') ?? [])

const imagesError = ref('')

async function handleLogoUploaded(result: UploadResult) {
  if (!business.value) return
  imagesError.value = ''
  try {
    await upsertSingleBusinessImage(business.value.id, 'logo', result.url)
    await refresh()
  } catch (error) {
    imagesError.value = error instanceof Error ? error.message : 'Could not save your logo.'
  }
}

async function handleLogoRemoved() {
  if (!logoImage.value) return
  imagesError.value = ''
  try {
    await deleteBusinessImage(logoImage.value.id)
    await refresh()
  } catch (error) {
    imagesError.value = error instanceof Error ? error.message : 'Could not remove your logo.'
  }
}

async function handleCoverUploaded(result: UploadResult) {
  if (!business.value) return
  imagesError.value = ''
  try {
    await upsertSingleBusinessImage(business.value.id, 'cover', result.url)
    await refresh()
  } catch (error) {
    imagesError.value = error instanceof Error ? error.message : 'Could not save your cover photo.'
  }
}

async function handleCoverRemoved() {
  if (!coverImage.value) return
  imagesError.value = ''
  try {
    await deleteBusinessImage(coverImage.value.id)
    await refresh()
  } catch (error) {
    imagesError.value = error instanceof Error ? error.message : 'Could not remove your cover photo.'
  }
}

async function handleGalleryItemUploaded(imageId: string, result: UploadResult) {
  imagesError.value = ''
  try {
    await updateBusinessImageUrl(imageId, result.url)
    await refresh()
  } catch (error) {
    imagesError.value = error instanceof Error ? error.message : 'Could not save that gallery photo.'
  }
}

async function handleGalleryItemRemoved(imageId: string) {
  imagesError.value = ''
  try {
    await deleteBusinessImage(imageId)
    await refresh()
  } catch (error) {
    imagesError.value = error instanceof Error ? error.message : 'Could not remove that gallery photo.'
  }
}

async function handleGalleryAdd(result: UploadResult) {
  if (!business.value) return
  imagesError.value = ''
  try {
    await addGalleryImage(business.value.id, result.url, galleryImages.value.length)
    await refresh()
  } catch (error) {
    imagesError.value = error instanceof Error ? error.message : 'Could not save that gallery photo.'
  }
}

useSeoMeta({
  title: () => `Edit ${business.value?.name ?? 'business'}`,
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
    <section class="border-line bg-surface mb-8 rounded-[18px] border p-5">
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

    <!-- Photos -->
    <section class="border-line bg-surface mb-8 rounded-[18px] border p-5">
      <h2 class="text-ink mb-1 text-sm font-semibold">
        Photos
      </h2>
      <p class="text-ink-muted mb-4 text-sm">
        Add a logo, a cover photo, and a few gallery photos.
      </p>

      <div class="mb-6 flex flex-wrap gap-6">
        <div class="flex flex-col gap-1.5">
          <span class="text-ink-faint text-xs font-medium tracking-wide uppercase">Logo</span>
          <UploadWidget
            kind="logos"
            :current-url="logoImage?.url"
            shape="circle"
            size-class="size-24"
            label="logo"
            @uploaded="handleLogoUploaded"
            @removed="handleLogoRemoved"
          />
        </div>
        <div class="flex min-w-56 flex-1 flex-col gap-1.5">
          <span class="text-ink-faint text-xs font-medium tracking-wide uppercase">Cover photo</span>
          <UploadWidget
            kind="covers"
            :current-url="coverImage?.url"
            aspect-ratio="16/9"
            label="cover photo"
            @uploaded="handleCoverUploaded"
            @removed="handleCoverRemoved"
          />
        </div>
      </div>

      <span class="text-ink-faint text-xs font-medium tracking-wide uppercase">Gallery</span>
      <div class="mt-1.5 grid grid-cols-3 gap-3 sm:grid-cols-4">
        <UploadWidget
          v-for="image in galleryImages"
          :key="image.id"
          kind="gallery"
          :current-url="image.url"
          label="gallery photo"
          @uploaded="(result) => handleGalleryItemUploaded(image.id, result)"
          @removed="() => handleGalleryItemRemoved(image.id)"
        />
        <UploadWidget
          :key="`gallery-add-${galleryImages.length}`"
          kind="gallery"
          :current-url="null"
          label="gallery photo"
          @uploaded="handleGalleryAdd"
        />
      </div>

      <UAlert
        v-if="imagesError"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        :description="imagesError"
        class="mt-3"
      />
    </section>

    <BusinessForm :existing-business="business" @submitted="handleSubmitted" />
  </div>
</template>
