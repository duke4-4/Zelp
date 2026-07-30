<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest',
  robots: false,
})

const { requestPasswordReset } = useAuth()

const state = reactive({
  email: '',
})

const submitError = ref('')
const successMessage = ref('')
const loading = ref(false)

function validate(state: { email: string }): FormError[] {
  const errors: FormError[] = []
  if (!state.email) {
    errors.push({ name: 'email', message: 'Email is required.' })
  } else if (!isValidEmail(state.email)) {
    errors.push({ name: 'email', message: 'Enter a valid email address.' })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  submitError.value = ''
  successMessage.value = ''
  loading.value = true
  try {
    await requestPasswordReset(event.data.email)
    successMessage.value = 'If an account exists for that email, a password reset link is on its way.'
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Failed to send reset email.'
  } finally {
    loading.value = false
  }
}

useSeoMeta({
  title: 'Reset your password',
  description: 'Request a password reset link for your Zelp account.',
})
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md flex-col justify-center gap-6 px-5 py-12">
    <div class="text-center">
      <h1 class="text-2xl font-semibold">
        Reset your password
      </h1>
      <p class="text-ink-muted mt-1 text-sm">
        We'll email you a link to reset it.
      </p>
    </div>

    <UAlert
      v-if="successMessage"
      color="success"
      variant="subtle"
      icon="i-lucide-check-circle"
      :description="successMessage"
    />

    <UAlert
      v-if="submitError"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
      title="Couldn't send reset email"
      :description="submitError"
    />

    <UForm :state="state" :validate="validate" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField label="Email" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          placeholder="you@example.com"
          class="w-full"
          autocomplete="email"
        />
      </UFormField>

      <UButton type="submit" label="Send reset link" block :loading="loading" />
    </UForm>

    <p class="text-center text-sm">
      <ULink to="/login" class="text-flame-500 font-medium">
        Back to log in
      </ULink>
    </p>
  </div>
</template>
