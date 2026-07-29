<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

// Deliberately no `auth`/`guest` middleware here: this page's whole job is
// to consume the one-time "recovery" session Supabase establishes from the
// link in the reset email, which is independent of any normal login state.

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { updatePassword } = useAuth()

type Status = 'checking' | 'ready' | 'invalid'
const status = ref<Status>('checking')

const state = reactive({
  password: '',
  confirmPassword: '',
})

const submitError = ref('')
const successMessage = ref('')
const loading = ref(false)

function validate(state: { password: string, confirmPassword: string }): FormError[] {
  const errors: FormError[] = []
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
  loading.value = true
  try {
    await updatePassword(event.data.password)
    successMessage.value = 'Your password has been updated.'
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Failed to update password.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // The recovery session may already have been established (the Supabase
  // client parses the recovery token from the URL as soon as it's created,
  // which can happen before this page's setup runs).
  if (user.value) {
    status.value = 'ready'
  }

  const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      status.value = 'ready'
    }
  })

  // Otherwise, give Supabase a moment to process the link before concluding
  // it's missing, invalid, or expired.
  const timeout = setTimeout(() => {
    if (status.value === 'checking' && !user.value) {
      status.value = 'invalid'
    }
  }, 3000)

  onUnmounted(() => {
    authListener.subscription.unsubscribe()
    clearTimeout(timeout)
  })
})
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md flex-col justify-center gap-6 px-5 py-12">
    <div class="text-center">
      <h1 class="text-2xl font-semibold">
        Choose a new password
      </h1>
    </div>

    <template v-if="status === 'checking'">
      <div class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="text-ink-faint size-6 animate-spin" />
      </div>
    </template>

    <template v-else-if="status === 'invalid'">
      <UAlert
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        title="This link is invalid or has expired"
        description="Password reset links can only be used once and expire after a while. Request a new one below."
      />
      <UButton to="/forgot-password" label="Request a new link" block />
    </template>

    <template v-else>
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
        title="Couldn't update password"
        :description="submitError"
      />

      <UButton v-if="successMessage" to="/login" label="Continue to log in" block />

      <UForm v-else :state="state" :validate="validate" class="flex flex-col gap-4" @submit="onSubmit">
        <UFormField label="New password" name="password" required hint="8+ characters">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            class="w-full"
            autocomplete="new-password"
          />
        </UFormField>

        <UFormField label="Confirm new password" name="confirmPassword" required>
          <UInput
            v-model="state.confirmPassword"
            type="password"
            placeholder="••••••••"
            class="w-full"
            autocomplete="new-password"
          />
        </UFormField>

        <UButton type="submit" label="Update password" block :loading="loading" />
      </UForm>
    </template>
  </div>
</template>
