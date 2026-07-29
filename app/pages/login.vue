<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: 'guest',
})

const route = useRoute()
const { signIn } = useAuth()

const state = reactive({
  email: '',
  password: '',
})

const submitError = ref('')
const loading = ref(false)

function validate(state: { email: string, password: string }): FormError[] {
  const errors: FormError[] = []
  if (!state.email) {
    errors.push({ name: 'email', message: 'Email is required.' })
  } else if (!isValidEmail(state.email)) {
    errors.push({ name: 'email', message: 'Enter a valid email address.' })
  }
  if (!state.password) {
    errors.push({ name: 'password', message: 'Password is required.' })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  submitError.value = ''
  loading.value = true
  try {
    await signIn(event.data.email, event.data.password)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect)
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Failed to sign in.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md flex-col justify-center gap-6 px-5 py-12">
    <BrandStripe class="w-full opacity-80" />

    <div class="text-center">
      <h1 class="text-2xl font-semibold">
        Log in to Zelp
      </h1>
      <p class="text-ink-muted mt-1 text-sm">
        Don't have an account?
        <ULink to="/signup" class="text-flame-500 font-medium">
          Sign up
        </ULink>
      </p>
    </div>

    <UAlert
      v-if="submitError"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
      title="Couldn't log in"
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

      <UFormField label="Password" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          autocomplete="current-password"
        />
      </UFormField>

      <div class="flex justify-end">
        <ULink to="/forgot-password" class="text-ink-muted hover:text-flame-500 text-sm">
          Forgot password?
        </ULink>
      </div>

      <UButton type="submit" label="Log in" block :loading="loading" />
    </UForm>
  </div>
</template>
