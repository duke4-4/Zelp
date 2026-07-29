<script setup lang="ts">
// Star rating display — read-only by default, driven off a numeric 0-5
// rating (typically `businesses.avg_rating`, which supports decimals — so
// the fill is a continuous percentage rather than snapped to whole/half
// stars). Set `interactive` + `v-model` for the editable rating input used
// by ReviewForm: same fill-percentage math, but the outer stars become
// buttons and the fill reflects the hovered/selected whole-star value.

const props = withDefaults(defineProps<{
  /** 0-5, decimals allowed. Ignored (in favour of `modelValue`) when `interactive` is true. */
  rating?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Show the numeric rating (e.g. "4.5") next to the stars. */
  showValue?: boolean
  /** Show a "(N)" review count next to the stars, if provided. */
  reviewCount?: number
  /** Renders a clickable, keyboard-focusable star input instead of a read-only display. */
  interactive?: boolean
  /** Whole-star selected value (1-5, 0 = none selected yet) when `interactive` is true. */
  modelValue?: number
  disabled?: boolean
}>(), {
  rating: 0,
  size: 'sm',
  showValue: false,
  reviewCount: undefined,
  interactive: false,
  modelValue: 0,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

const clampedRating = computed(() => Math.min(Math.max(props.rating || 0, 0), 5))
const fillPercent = computed(() => `${(clampedRating.value / 5) * 100}%`)

// Interactive mode: fill follows the hovered/focused star while the pointer
// is over the control, falling back to the committed `modelValue`.
const hovered = ref<number | null>(null)
const displayValue = computed(() => hovered.value ?? props.modelValue)
const interactiveFillPercent = computed(() => `${(displayValue.value / 5) * 100}%`)

function selectStar(i: number) {
  if (!props.interactive || props.disabled) return
  emit('update:modelValue', i)
}
function previewStar(i: number | null) {
  if (!props.interactive || props.disabled) return
  hovered.value = i
}
</script>

<template>
  <div class="inline-flex items-center gap-1.5">
    <!-- Read-only display -->
    <div
      v-if="!interactive"
      class="relative inline-flex"
      role="img"
      :aria-label="`Rated ${clampedRating.toFixed(1)} out of 5`"
    >
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

    <!-- Interactive input -->
    <div
      v-else
      class="relative inline-flex"
      role="radiogroup"
      aria-label="Rating"
      @mouseleave="previewStar(null)"
    >
      <div class="text-ink-200 dark:text-ink-700 flex gap-0.5">
        <button
          v-for="i in 5"
          :key="`star-${i}`"
          type="button"
          role="radio"
          :aria-checked="modelValue === i"
          :aria-label="`${i} star${i > 1 ? 's' : ''}`"
          :disabled="disabled"
          class="flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 leading-none disabled:cursor-not-allowed disabled:opacity-60"
          @click="selectStar(i)"
          @mouseenter="previewStar(i)"
          @focus="previewStar(i)"
          @blur="previewStar(null)"
        >
          <UIcon name="i-lucide-star" :class="sizeClasses[size]" />
        </button>
      </div>
      <div
        class="text-gold-500 pointer-events-none absolute inset-0 flex gap-0.5 overflow-hidden"
        :style="{ width: interactiveFillPercent }"
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
