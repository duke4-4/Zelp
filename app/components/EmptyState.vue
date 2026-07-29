<script setup lang="ts">
// Generic empty state used across the app: no categories yet, no search
// results, no images uploaded, etc. Thin wrapper around Nuxt UI's `UEmpty`
// so every empty state in the app shares one visual language, with slots
// for the cases that need something custom.

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
  <UEmpty :icon="icon" :title="title" :description="description" class="py-12">
    <template v-if="$slots.icon" #leading>
      <slot name="icon" />
    </template>
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </UEmpty>
</template>
