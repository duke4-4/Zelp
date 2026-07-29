<script setup lang="ts">
// Read-only star rating display, driven off a numeric 0-5 rating (typically
// `businesses.avg_rating`, which supports decimals — so the fill is a
// continuous percentage rather than snapped to whole/half stars).
//
// TODO(Phase 4): when review submission needs an editable rating input,
// extend this component with an `interactive` + `modelValue` prop rather
// than building a separate component — the star-layout markup below is
// already structured to support that (swap the outer `div` for a
// `button`-per-star when `interactive` is true).

const props = withDefaults(defineProps<{
  /** 0-5, decimals allowed. */
  rating: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Show the numeric rating (e.g. "4.5") next to the stars. */
  showValue?: boolean
  /** Show a "(N)" review count next to the stars, if provided. */
  reviewCount?: number
}>(), {
  size: 'sm',
  showValue: false,
  reviewCount: undefined,
})

const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

const clampedRating = computed(() => Math.min(Math.max(props.rating || 0, 0), 5))
const fillPercent = computed(() => `${(clampedRating.value / 5) * 100}%`)
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5"
    role="img"
    :aria-label="`Rated ${clampedRating.toFixed(1)} out of 5`"
  >
    <div class="relative inline-flex">
      <div class="text-ink-200 dark:text-ink-700 flex gap-0.5">
        <UIcon v-for="i in 5" :key="`bg-${i}`" name="i-lucide-star" :class="sizeClasses[size]" />
      </div>
      <div
        class="text-gold-500 absolute inset-0 flex gap-0.5 overflow-hidden"
        :style="{ width: fillPercent }"
      >
        <UIcon
          v-for="i in 5"
          :key="`fg-${i}`"
          name="i-lucide-star"
          class="shrink-0"
          :class="sizeClasses[size]"
        />
      </div>
    </div>
    <span v-if="showValue" class="text-ink tabular-nums text-sm font-medium">{{ clampedRating.toFixed(1) }}</span>
    <span v-if="typeof reviewCount === 'number'" class="text-ink-faint tabular-nums text-sm">
      ({{ reviewCount }})
    </span>
  </div>
</template>
