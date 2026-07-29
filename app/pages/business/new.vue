<script setup lang="ts">
// Business creation form. On success, the new business (always created as
// `status: 'draft'` — see useOwnedBusinesses.ts) is opened straight into
// its dashboard, where the owner can see it's set up and, when ready,
// request review (draft -> pending) from the edit page.

definePageMeta({
  middleware: 'auth',
})

async function handleSubmitted(result: { id: string, slug: string }) {
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

    <BusinessForm @submitted="handleSubmitted" />
  </div>
</template>
