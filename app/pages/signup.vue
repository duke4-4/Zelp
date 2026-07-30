<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest',
  robots: false,
})

const { signUp } = useAuth()

useSeoMeta({
  title: 'Sign up',
  description: 'Create a free Zelp account.',
})

const state = reactive({
  email: '',
  password: '',
  confirmPassword: '',
})

const submitError = ref('')
const successMessage = ref('')
const loading = ref(false)

function validate(state: { email: string, password: string, confirmPassword: string }): FormError[] {
  const errors: FormError[] = []
  if (!state.email) {
    errors.push({ name: 'email', message: 'Email is required.' })
  } else if (!isValidEmail(state.email)) {
    errors.push({ name: 'email', message: 'Enter a valid email address.' })
  }
  if (!state.password) {
    errors.push({ name: 'password', message: 'Password is required.' })
  } else if (state.password.length < MIN_PASSWORD_LENGTH) {
    errors.push({ name: 'password', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` })
  }
  if (!state.confirmPassword) {
    errors.push({ name: 'confirmPassword', message: 'Please confirm your password.' })
  } else if (state.password !== state.confirmPassword) {
    errors.push({ name: 'confirmPassword', message: 'Passwords do not match.' })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  submitError.value = ''
  successMessage.value = ''
  loading.value = true
  try {
    const result = await signUp(event.data.email, event.data.password)
    if (result.session) {
      // Email confirmation is disabled for this project — the user is signed in immediately.
      await navigateTo('/')
      return
    }
    // Email confirmation required: no session yet, tell the user to check their inbox.
    successMessage.value = 'Account created! Check your email to confirm your address before logging in.'
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Failed to sign up.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md flex-col justify-center gap-6 px-5 py-12">
    <FlagLine class="w-full" />

    <div class="text-center">
      <h1 class="text-2xl font-semibold">
        Create your Zelp account
      </h1>
      <p class="text-ink-muted mt-1 text-sm">
        Already have an account?
        <ULink to="/login" class="text-flame-500 font-medium">
          Log in
        </ULink>
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
      title="Couldn't sign up"
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

      <UFormField label="Password" name="password" required hint="8+ characters">
        <UInput
          v-model="state.password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          autocomplete="new-password"
        />
      </UFormField>

      <UFormField label="Confirm password" name="confirmPassword" required>
        <UInput
          v-model="state.confirmPassword"
          type="password"
          placeholder="••••••••"
          class="w-full"
          autocomplete="new-password"
        />
      </UFormField>

      <UButton type="submit" label="Sign up" block :loading="loading" />
    </UForm>
  </div>
</template>
