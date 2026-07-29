<script setup lang="ts">
const SPLASH_DURATION_MS = 1_300
const visible = ref(true)

onMounted(() => {
  window.setTimeout(() => {
    visible.value = false
  }, SPLASH_DURATION_MS)
})
</script>

<template>
  <Transition name="splash">
    <div v-if="visible" class="bg-stone fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8" aria-label="Loading Zelp">
      <img src="/brand/zelp-logo-stacked.svg" alt="Zelp" class="w-44 max-w-[60vw]" />
      <BrandStripe class="w-28" />
    </div>
  </Transition>
</template>
