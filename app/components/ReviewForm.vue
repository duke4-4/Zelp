<script setup lang="ts">
// Star rating input + comment, used both to write a new review and to edit
// an existing one (mode is inferred from whether `existingReview` is set).
// The submit button stays disabled until a star rating is chosen, per the
// project's convention of disabling submit until the form is actually
// valid rather than letting the user hit an avoidable error.

import type { ReviewItem } from '~/composables/useReviews'

const props = defineProps<{
  businessId: string
  existingReview?: ReviewItem | null
}>()

const emit = defineEmits<{
  submitted: [review: ReviewItem]
  cancel: []
}>()

const isEditMode = computed(() => !!props.existingReview)
const toast = useToast()

const rating = ref(props.existingReview?.rating ?? 0)
const comment = ref(props.existingReview?.comment ?? '')
const submitting = ref(false)
const errorMessage = ref('')

// Keep the fields in sync if the caller swaps which review is being edited
// (e.g. re-opening the form after a fresh fetch).
watch(() => props.existingReview, (review) => {
  rating.value = review?.rating ?? 0
  comment.value = review?.comment ?? ''
  errorMessage.value = ''
})

const canSubmit = computed(() => rating.value > 0 && !submitting.value)

async function handleSubmit() {
  if (rating.value < 1) {
    errorMessage.value = 'Please select a star rating.'
    return
  }

  errorMessage.value = ''
  submitting.value = true
  try {
    const trimmedComment = comment.value.trim() || null
    const result = isEditMode.value && props.existingReview
      ? await updateReview(props.existingReview.id, rating.value, trimmedComment)
      : await createReview(props.businessId, rating.value, trimmedComment)
    // A toast here (rather than an inline UAlert like the rest of the app's
    // forms) because this form disappears/gets replaced by the reviews list
    // the instant it succeeds -- there's no page left for an inline success
    // message to live on.
    toast.add({
      title: isEditMode.value ? 'Review updated' : 'Review posted',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    emit('submitted', result)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-1.5">
      <span class="text-ink text-sm font-medium">Your rating</span>
      <RatingStars v-model="rating" interactive size="lg" :disabled="submitting" />
    </div>

    <UTextarea
      v-model="comment"
      placeholder="Share details of your own experience at this business..."
      :rows="4"
      :maxlength="2000"
      :disabled="submitting"
      class="w-full"
    />

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
      :description="errorMessage"
    />

    <div class="flex items-center gap-2">
      <UButton
        type="submit"
        :label="isEditMode ? 'Save changes' : 'Post review'"
        :loading="submitting"
        :disabled="!canSubmit"
      />
      <UButton
        v-if="isEditMode"
        type="button"
        variant="ghost"
        color="neutral"
        label="Cancel"
        :disabled="submitting"
        @click="emit('cancel')"
      />
    </div>
  </form>
</template>
