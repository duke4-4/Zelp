<script setup lang="ts">
// A single review: reviewer avatar (real photo when uploaded, otherwise an
// initial-letter fallback — see ProfileAvatar), gold stars, date, comment —
// plus Edit/Delete, shown only when the review belongs to the signed-in
// viewer. Edit swaps the card body for `ReviewForm` in edit mode; Delete
// asks for confirmation inline before calling the mutation (no silent,
// un-confirmed deletes).

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
      <div class="flex items-center gap-3">
        <ProfileAvatar :avatar-url="review.reviewer.avatarUrl" :name="reviewerName" size="md" />
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="text-ink text-sm font-medium">{{ reviewerName }}</span>
          <span class="text-ink-faint text-xs tabular-nums">
            {{ formattedDate }}
            <template v-if="wasEdited"> · edited</template>
          </span>
        </div>
        <RatingStars :rating="review.rating" size="sm" class="shrink-0" />
      </div>

      <p v-if="review.comment" class="text-ink-muted text-sm leading-relaxed whitespace-pre-line">
        {{ review.comment }}
      </p>

      <div v-if="isOwnReview && !isConfirmingDelete" class="flex items-center gap-4 text-xs font-semibold">
        <button
          type="button"
          class="text-ink-faint hover:text-flame-500 transition-colors"
          @click="isEditing = true"
        >
          Edit
        </button>
        <button
          type="button"
          class="text-ink-faint hover:text-flame-500 transition-colors"
          @click="isConfirmingDelete = true"
        >
          Delete
        </button>
      </div>

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
