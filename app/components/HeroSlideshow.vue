<script setup lang="ts">
const slides = [
  { src: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=85', alt: 'A welcoming restaurant table' },
  { src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=85', alt: 'A salon interior' },
  { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85', alt: 'A comfortable boutique stay' },
]

const active = ref(0)
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => { active.value = (active.value + 1) % slides.length }, 4500)
})

onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })
</script>

<template>
  <div class="absolute inset-0 overflow-hidden" aria-hidden="true">
    <img v-for="(slide, index) in slides" :key="slide.src" :src="slide.src" :alt="slide.alt" class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700" :class="index === active ? 'opacity-100' : 'opacity-0'">
    <div class="absolute inset-0 bg-gradient-to-r from-ink-900/75 via-ink-900/50 to-ink-900/25" />
  </div>
  <div class="absolute right-5 bottom-5 z-10 flex gap-2" aria-label="Featured places">
    <button v-for="(slide, index) in slides" :key="slide.src" type="button" class="border-stone/70 h-12 w-16 overflow-hidden rounded-[10px] border-2 transition" :class="index === active ? 'opacity-100 ring-2 ring-flame-400' : 'opacity-60 hover:opacity-100'" :aria-label="`Show slide ${index + 1}`" @click="active = index">
      <img :src="slide.src" alt="" class="h-full w-full object-cover">
    </button>
  </div>
</template>
