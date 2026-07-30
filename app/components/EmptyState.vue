<script setup lang="ts">
// Generic empty state used across the app: no categories yet, no search
// results, no reviews, etc. One of the sanctioned uses of the flagline
// motif (see app/components/FlagLine.vue) — a decorative band above the
// copy, never behind text. Replaces the old chevron-frieze pattern here.

withDefaults(defineProps<{
  icon?: string
  title: string
  description?: string
}>(), {
  icon: 'i-lucide-inbox',
  description: undefined,
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-12 text-center">
    <FlagLine class="w-36" />

    <slot name="icon">
      <UIcon :name="icon" class="text-ink-faint size-8" />
    </slot>

    <div class="flex flex-col gap-1">
      <p class="text-ink text-base font-medium">
        {{ title }}
      </p>
      <p v-if="description" class="text-ink-muted max-w-sm text-sm">
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.actions" class="mt-1">
      <slot name="actions" />
    </div>
  </div>
</template>
