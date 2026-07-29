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
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelect
      v-model="categoryModel"
      :items="categoryItems"
      value-key="value"
      label-key="label"
      :loading="categoriesStatus === 'pending'"
      placeholder="Category"
      icon="i-lucide-tag"
      class="w-44"
    />
    <USelect
      v-model="ratingModel"
      :items="ratingItems"
      value-key="value"
      label-key="label"
      placeholder="Rating"
      icon="i-lucide-star"
      class="w-36"
    />
    <USelect
      v-model="sortModel"
      :items="sortItems"
      value-key="value"
      label-key="label"
      placeholder="Sort by"
      icon="i-lucide-arrow-up-down"
      class="w-36"
    />
  </div>
</template>
