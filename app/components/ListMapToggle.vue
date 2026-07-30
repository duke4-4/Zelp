<script setup lang="ts">
// Reciprocal list/map segmented control shared by /search and /map (Phase
// 7). /search originally shipped this as an inert placeholder (the "Map"
// side disabled) with a comment noting Phase 7 would wire it up — this
// component is that wiring, used from both sides so the two pages stay in
// sync rather than each hand-rolling its own version of the control.

import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  active: 'list' | 'map'
  listTo: RouteLocationRaw
  mapTo: RouteLocationRaw
}>()

const activeClass = 'bg-flame-tint text-flame-500 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium'
const inactiveClass = 'text-ink-faint hover:text-ink flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors'
</script>

<template>
  <div class="border-line bg-surface flex shrink-0 items-center gap-0.5 rounded-full border p-0.5" role="group" aria-label="View">
    <span v-if="active === 'list'" :class="activeClass">
      <UIcon name="i-lucide-list" class="size-4" />
      List
    </span>
    <ULink v-else :to="listTo" :class="inactiveClass">
      <UIcon name="i-lucide-list" class="size-4" />
      List
    </ULink>

    <span v-if="active === 'map'" :class="activeClass">
      <UIcon name="i-lucide-map" class="size-4" />
      Map
    </span>
    <ULink v-else :to="mapTo" :class="inactiveClass">
      <UIcon name="i-lucide-map" class="size-4" />
      Map
    </ULink>
  </div>
</template>
