<script setup lang="ts">
// Shared avatar rendering: shows the real uploaded photo (`avatarUrl`) when
// present, falling back to an initial-letter treatment when it isn't — the
// same fallback look `UAvatar` already renders internally when given no
// `src`. Centralizes this so Navbar/ReviewCard/profile pages don't each
// re-derive "first letter of name" separately (Phase 6).

const props = withDefaults(defineProps<{
  avatarUrl?: string | null
  /** Full name / username / email — whatever's available; only its first character is used. */
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}>(), {
  avatarUrl: null,
  name: null,
  size: 'md',
})

const initial = computed(() => {
  const trimmed = props.name?.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
})
</script>

<template>
  <UAvatar :src="avatarUrl ?? undefined" :text="initial" :size="size" />
</template>
