<script setup lang="ts">
// Real photography (user-supplied, stored locally under public/images/hero,
// optimized on request via @nuxt/image) of places across Zimbabwe — not
// stock/hotlinked imagery, and not a claim that any of these specific
// businesses are listed on Zelp. Purely a hero backdrop.
const slides = [
  { src: '/images/hero/holiday-inn-harare.avif', alt: 'Holiday Inn, Harare' },
  { src: '/images/hero/national-art-gallery-harare.jpg', alt: 'National Art Gallery, Harare' },
  { src: '/images/hero/hyatt.jpg', alt: 'Hyatt hotel' },
  { src: '/images/hero/pottery-barn.jpg', alt: 'Pottery Barn' },
  { src: '/images/hero/victoria-falls.jpg', alt: 'Victoria Falls' },
]

const active = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => { active.value = (active.value + 1) % slides.length }, 4500)
})

onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="absolute inset-0 overflow-hidden" aria-hidden="true">
    <NuxtImg
      v-for="(slide, index) in slides"
      :key="slide.src"
      :src="slide.src"
      :alt="slide.alt"
      format="webp"
      width="1600"
      height="1000"
      fit="cover"
      :loading="index === 0 ? 'eager' : 'lazy'"
      sizes="100vw"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
      :class="index === active ? 'opacity-100' : 'opacity-0'"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-ink-900/75 via-ink-900/50 to-ink-900/25" />
  </div>
  <div class="absolute right-5 bottom-5 z-10 flex gap-2" aria-label="Featured places">
    <button
      v-for="(slide, index) in slides"
      :key="slide.src"
      type="button"
      class="border-stone/70 h-12 w-16 overflow-hidden rounded-[10px] border-2 transition"
      :class="index === active ? 'opacity-100 ring-2 ring-flame-400' : 'opacity-60 hover:opacity-100'"
      :aria-label="`Show slide ${index + 1}`"
      @click="active = index"
    >
      <NuxtImg :src="slide.src" :alt="slide.alt" format="webp" width="128" height="96" fit="cover" loading="lazy" class="h-full w-full object-cover" />
    </button>
  </div>
</template>
