<script setup lang="ts">
// Business creation form. On success, the new business (always created as
// `status: 'draft'` — see useOwnedBusinesses.ts) is opened straight into
// its dashboard, where the owner can see it's set up and, when ready,
// request review (draft -> pending) from the edit page.
//
// Photos (Phase 6): the business doesn't exist yet while this form is being
// filled in, so logo/cover/gallery uploads are staged locally (the storage
// path only ever needs the signed-in *user's* id — see useUpload.ts — so
// uploading ahead of the business row existing is safe) and only attached
// as real `business_images` rows once `createBusiness` returns an id.

import type { UploadResult } from '~/composables/useUpload'

definePageMeta({
  middleware: 'auth',
})

const logoUrl = ref<string | null>(null)
const coverUrl = ref<string | null>(null)
const galleryUrls = ref<string[]>([])

function handleLogoUploaded(result: UploadResult) {
  logoUrl.value = result.url
}
function handleLogoRemoved() {
  logoUrl.value = null
}
function handleCoverUploaded(result: UploadResult) {
  coverUrl.value = result.url
}
function handleCoverRemoved() {
  coverUrl.value = null
}
function handleGalleryAdd(result: UploadResult) {
  galleryUrls.value.push(result.url)
}
function handleGalleryItemUploaded(index: number, result: UploadResult) {
  galleryUrls.value[index] = result.url
}
function handleGalleryItemRemoved(index: number) {
  galleryUrls.value.splice(index, 1)
}

async function handleSubmitted(result: { id: string, slug: string }) {
  try {
    if (logoUrl.value) await upsertSingleBusinessImage(result.id, 'logo', logoUrl.value)
    if (coverUrl.value) await upsertSingleBusinessImage(result.id, 'cover', coverUrl.value)
    for (let i = 0; i < galleryUrls.value.length; i++) {
      await addGalleryImage(result.id, galleryUrls.value[i]!, i)
    }
  } catch (error) {
    // The business itself was created successfully — photos are secondary,
    // and can still be added/retried from the edit page — so this doesn't
    // block navigation, just surfaces in the console for debugging.
    console.error('[business/new] Failed to attach uploaded photos to the new business:', error)
  }
  await navigateTo({ path: '/business/dashboard', query: { business: result.id } })
}

useSeoMeta({
  title: 'List your business — Zelp',
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-5 py-8">
    <h1 class="text-ink mb-1 text-2xl font-semibold">
      List your business
    </h1>
    <p class="text-ink-muted mb-8 text-sm">
      Your listing starts as a draft — you'll be able to review it and request publishing once it's ready.
    </p>

    <section class="border-line mb-8 rounded-[18px] border p-4">
      <h2 class="text-ink mb-1 text-sm font-semibold">
        Photos
      </h2>
      <p class="text-ink-muted mb-4 text-sm">
        Optional — add a logo, a cover photo, and a few gallery photos. You can always add or change these later.
      </p>

      <div class="mb-6 flex flex-wrap gap-6">
        <div class="flex flex-col gap-1.5">
          <span class="text-ink-faint text-xs font-medium tracking-wide uppercase">Logo</span>
          <UploadWidget
            kind="logos"
            :current-url="logoUrl"
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
            :current-url="coverUrl"
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
          v-for="(url, index) in galleryUrls"
          :key="`gallery-${index}`"
          kind="gallery"
          :current-url="url"
          label="gallery photo"
          @uploaded="(result) => handleGalleryItemUploaded(index, result)"
          @removed="() => handleGalleryItemRemoved(index)"
        />
        <UploadWidget
          :key="`gallery-add-${galleryUrls.length}`"
          kind="gallery"
          :current-url="null"
          label="gallery photo"
          @uploaded="handleGalleryAdd"
        />
      </div>
    </section>

    <BusinessForm @submitted="handleSubmitted" />
  </div>
</template>
