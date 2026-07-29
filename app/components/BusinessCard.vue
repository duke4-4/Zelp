<script setup lang="ts">
import type { BusinessListItem } from '~/composables/useBusinesses'

defineProps<{
  business: BusinessListItem
}>()
</script>

<template>
  <ULink
    :to="`/business/${business.slug}`"
    class="group border-default hover:border-primary/50 bg-default flex flex-col overflow-hidden rounded-lg border transition hover:shadow-md"
  >
    <div class="bg-elevated aspect-[4/3] w-full overflow-hidden">
      <NuxtImg
        v-if="business.coverImageUrl"
        :src="business.coverImageUrl"
        :alt="business.name"
        class="h-full w-full object-cover transition duration-200 group-hover:scale-105"
        loading="lazy"
        width="480"
        height="360"
      />
      <div v-else class="text-muted flex h-full w-full items-center justify-center">
        <UIcon name="i-lucide-store" class="size-10" />
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 p-4">
      <h3 class="text-highlighted line-clamp-1 font-semibold">
        {{ business.name }}
      </h3>

      <div v-if="business.categories.length" class="flex flex-wrap gap-1">
        <UBadge
          v-for="category in business.categories.slice(0, 3)"
          :key="category.id"
          :label="category.name"
          variant="subtle"
          color="neutral"
          size="sm"
        />
      </div>

      <RatingStars
        :rating="business.avgRating"
        size="sm"
        show-value
        :review-count="business.reviewCount"
      />

      <p v-if="business.city || business.province" class="text-muted mt-auto flex items-center gap-1 text-sm">
        <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
        <span class="line-clamp-1">{{ [business.city, business.province].filter(Boolean).join(', ') }}</span>
      </p>
    </div>
  </ULink>
</template>
