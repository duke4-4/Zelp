<script setup lang="ts">
// A single review: reviewer initial-avatar (real avatar upload is Phase 6),
// gold stars, date, comment — plus Edit/Delete, shown only when the review
// belongs to the signed-in viewer. Edit swaps the card body for
// `ReviewForm` in edit mode; Delete asks for confirmation inline before
// calling the mutation (no silent, un-confirmed deletes).

import type { ReviewItem } from '~/composables/useReviews'

const props = defineProps<{
  review: ReviewItem
}>()

const emit = defineEmits<{
  updated: [review: ReviewItem]
  deleted: [reviewId: string]
}>()

const user = useSupabaseUser()
const isOwnReview = computed(() => !!user.value && user.value.id === props.review.userId)

const reviewerInitial = computed(() => {
  const name = props.review.reviewer.fullName
  return name ? name.trim().charAt(0).toUpperCase() : '?'
})
const reviewerName = computed(() => props.review.reviewer.fullName || 'Zelp user')

const dateFormatter = new Intl.DateTimeFormat('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
const formattedDate = computed(() => dateFormatter.format(new Date(props.review.createdAt)))
const wasEdited = computed(() => !!props.review.updatedAt && props.review.updatedAt !== props.review.createdAt)

const isEditing = ref(false)
const isConfirmingDelete = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')

function handleUpdated(updated: ReviewItem) {
  isEditing.value = false
  emit('updated', updated)
}

async function confirmDelete() {
  deleteError.value = ''
  isDeleting.value = true
  try {
    await deleteReview(props.review.id)
    emit('deleted', props.review.id)
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : 'Could not delete this review. Please try again.'
    isDeleting.value = false
    isConfirmingDelete.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-3 py-5">
    <ReviewForm
      v-if="isEditing"
      :business-id="review.businessId"
      :existing-review="review"
      @submitted="handleUpdated"
      @cancel="isEditing = false"
    />

    <template v-else>
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <UAvatar :src="review.reviewer.avatarUrl ?? undefined" :text="reviewerInitial" size="md" />
          <div class="flex flex-col">
            <span class="text-ink text-sm font-medium">{{ reviewerName }}</span>
            <span class="text-ink-faint text-xs">
              {{ formattedDate }}
              <template v-if="wasEdited"> · edited</template>
            </span>
          </div>
        </div>

        <div v-if="isOwnReview && !isConfirmingDelete" class="flex shrink-0 items-center gap-1">
          <UButton
            icon="i-lucide-pencil"
            variant="ghost"
            color="neutral"
            size="xs"
            aria-label="Edit your review"
            @click="isEditing = true"
          />
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="neutral"
            size="xs"
            aria-label="Delete your review"
            @click="isConfirmingDelete = true"
          />
        </div>
      </div>

      <RatingStars :rating="review.rating" size="sm" />

      <p v-if="review.comment" class="text-ink-muted text-sm whitespace-pre-line">
        {{ review.comment }}
      </p>

      <UAlert
        v-if="deleteError"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        :description="deleteError"
      />

      <div v-if="isConfirmingDelete" class="bg-closed-50 flex flex-wrap items-center gap-2 rounded-[12px] p-3 text-sm">
        <span class="text-ink">Delete this review? This can't be undone.</span>
        <div class="ml-auto flex items-center gap-2">
          <UButton
            label="Delete"
            color="error"
            variant="solid"
            size="xs"
            :loading="isDeleting"
            @click="confirmDelete"
          />
          <UButton
            label="Cancel"
            variant="ghost"
            color="neutral"
            size="xs"
            :disabled="isDeleting"
            @click="isConfirmingDelete = false"
          />
        </div>
      </div>
    </template>
  </div>
</template>
