<script setup lang="ts">
// Generic empty state used across the app: no categories yet, no search
// results, no reviews, etc. One of the three sanctioned uses of the chevron
// frieze pattern (docs/zelp-brand-guidelines.md) — a decorative band above
// the copy, never behind text.

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
    <div class="h-10 w-36 overflow-hidden rounded-full" aria-hidden="true">
      <img
        src="/brand/zelp-pattern-chevron.svg"
        alt=""
        class="h-full w-full object-cover"
      >
    </div>

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
