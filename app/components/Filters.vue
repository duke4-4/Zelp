<script setup lang="ts">
// Category / rating / sort controls for the business list. Deliberately
// route-agnostic (controlled `modelValue` + `update:modelValue`, no direct
// route access) so it can be reused as-is on /search now and on /map later
// — the page that renders it owns syncing the value to/from the URL.

export interface FiltersValue {
  category?: string
  minRating?: number
  sort?: 'rating' | 'newest'
}

const props = defineProps<{
  modelValue: FiltersValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FiltersValue]
}>()

const { data: categories, status: categoriesStatus } = useCategories()

const categoryItems = computed(() => [
  { label: 'All categories', value: '' },
  ...categories.value.map(category => ({ label: category.name, value: category.slug })),
])

const ratingItems = [
  { label: 'Any rating', value: '' },
  { label: '4+ stars', value: '4' },
  { label: '3+ stars', value: '3' },
  { label: '2+ stars', value: '2' },
]

const sortItems: { label: string, value: 'newest' | 'rating' }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Top rated', value: 'rating' },
]

const categoryModel = computed<string>({
  get: () => props.modelValue.category ?? '',
  set: (value) => emit('update:modelValue', { ...props.modelValue, category: value || undefined }),
})

const ratingModel = computed<string>({
  get: () => props.modelValue.minRating ? String(props.modelValue.minRating) : '',
  set: (value) => emit('update:modelValue', { ...props.modelValue, minRating: value ? Number(value) : undefined }),
})

const sortModel = computed<'newest' | 'rating'>({
  get: () => props.modelValue.sort ?? 'newest',
  set: (value) => emit('update:modelValue', { ...props.modelValue, sort: value }),
})

// Chip-row treatment: unselected chips are white/line-border, an active
// filter (non-default value) fills with flame-tint + flame border/text.
const chipUi = { base: 'rounded-full' }
</script>

<template>
  <div class="flex flex-wrap items-center gap-2.5">
    <USelect
      v-model="categoryModel"
      :items="categoryItems"
      value-key="value"
      label-key="label"
      :loading="categoriesStatus === 'pending'"
      :color="categoryModel ? 'primary' : 'neutral'"
      :variant="categoryModel ? 'subtle' : 'outline'"
      placeholder="Category"
      icon="i-lucide-tag"
      class="w-44"
      :ui="chipUi"
    />
    <USelect
      v-model="ratingModel"
      :items="ratingItems"
      value-key="value"
      label-key="label"
      :color="ratingModel ? 'primary' : 'neutral'"
      :variant="ratingModel ? 'subtle' : 'outline'"
      placeholder="Rating"
      icon="i-lucide-star"
      class="w-36"
      :ui="chipUi"
    />
    <USelect
      v-model="sortModel"
      :items="sortItems"
      value-key="value"
      label-key="label"
      :color="sortModel !== 'newest' ? 'primary' : 'neutral'"
      :variant="sortModel !== 'newest' ? 'subtle' : 'outline'"
      placeholder="Sort by"
      icon="i-lucide-arrow-up-down"
      class="w-36"
      :ui="chipUi"
    />
  </div>
</template>
