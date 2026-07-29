<script setup lang="ts">
// Controlled pagination control: the parent owns the current page (usually
// synced to the route's `page` query param) and passes it in; this
// component just renders Nuxt UI's pagination and emits the requested page.
// Renders nothing when everything fits on a single page.

const props = defineProps<{
  page: number
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()
</script>

<template>
  <UPagination
    v-if="props.total > props.pageSize"
    :page="props.page"
    :items-per-page="props.pageSize"
    :total="props.total"
    @update:page="(value: number) => emit('update:page', value)"
  />
</template>
