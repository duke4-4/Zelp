<script setup lang="ts">
import type { BusinessImageLite } from '~/composables/useBusinesses'

const props = defineProps<{
  images: BusinessImageLite[]
  /** Used for alt text and the empty-state message. */
  businessName: string
}>()

const activeIndex = ref<number | null>(null)
const isOpen = computed({
  get: () => activeIndex.value !== null,
  set: (value: boolean) => {
    if (!value) activeIndex.value = null
  },
})

function open(index: number) {
  activeIndex.value = index
}

function next() {
  if (activeIndex.value === null) return
  activeIndex.value = (activeIndex.value + 1) % props.images.length
}

function prev() {
  if (activeIndex.value === null) return
  activeIndex.value = (activeIndex.value - 1 + props.images.length) % props.images.length
}

const activeImage = computed(() => activeIndex.value !== null ? props.images[activeIndex.value] : null)
</script>

<template>
  <div v-if="images.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
    <button
      v-for="(image, index) in images"
      :key="image.id"
      type="button"
      class="bg-ink-100 aspect-square overflow-hidden rounded-[14px] transition hover:opacity-90"
      @click="open(index)"
    >
      <NuxtImg
        :src="image.url"
        :alt="`${businessName} photo ${index + 1}`"
        class="h-full w-full object-cover transition hover:scale-105"
        loading="lazy"
        width="300"
        height="300"
      />
    </button>

    <UModal v-model:open="isOpen">
      <template #content>
        <div class="relative flex items-center justify-center bg-black/90 p-4">
          <NuxtImg
            v-if="activeImage"
            :src="activeImage.url"
            :alt="`${businessName} photo`"
            class="max-h-[80vh] w-full rounded object-contain"
          />
          <UButton
            v-if="images.length > 1"
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="ghost"
            class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60"
            aria-label="Previous photo"
            @click="prev"
          />
          <UButton
            v-if="images.length > 1"
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="ghost"
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60"
            aria-label="Next photo"
            @click="next"
          />
        </div>
      </template>
    </UModal>
  </div>

  <EmptyState
    v-else
    icon="i-lucide-image-off"
    title="No photos yet"
    :description="`${businessName} hasn't uploaded any photos yet.`"
  />
</template>
