<script setup lang="ts">
// Profile edit form + account settings (sign out, change-password link).
// Avatar upload (Phase 6) saves immediately via `updateProfileAvatar` on
// success/removal — independent of the rest of this form's own "Save
// changes" step, since `avatar_url` isn't one of its fields.

import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { UploadResult } from '~/composables/useUpload'

definePageMeta({
  middleware: 'auth',
})

const { data: profile, status, refresh } = useMyProfile()
const pending = computed(() => status.value === 'pending')
const { signOut } = useAuth()

const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/you' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/you' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/you' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you' },
] as const

function socialsStateFromRecord(socials: Record<string, unknown> | null | undefined): Record<string, string> {
  const state: Record<string, string> = {}
  for (const field of SOCIAL_FIELDS) {
    const value = socials?.[field.key]
    state[field.key] = typeof value === 'string' ? value : ''
  }
  return state
}

const state = reactive({
  fullName: '',
  username: '',
  bio: '',
  location: '',
  website: '',
  socials: socialsStateFromRecord(null),
})

// Populate the form once the profile has loaded (it's fetched async, so
// isn't available yet on first render).
watch(profile, (value) => {
  if (!value) return
  state.fullName = value.fullName ?? ''
  state.username = value.username ?? ''
  state.bio = value.bio ?? ''
  state.location = value.location ?? ''
  state.website = value.website ?? ''
  state.socials = socialsStateFromRecord(value.socials)
}, { immediate: true })

const avatarError = ref('')

async function handleAvatarUploaded(result: UploadResult) {
  avatarError.value = ''
  try {
    await updateProfileAvatar(result.url)
    await refresh()
  } catch (error) {
    avatarError.value = error instanceof Error ? error.message : 'Could not save your new photo.'
  }
}

async function handleAvatarRemoved() {
  avatarError.value = ''
  try {
    await updateProfileAvatar(null)
    await refresh()
  } catch (error) {
    avatarError.value = error instanceof Error ? error.message : 'Could not remove your photo.'
  }
}

const submitError = ref('')
const successMessage = ref('')
const submitting = ref(false)
const signingOut = ref(false)

function validate(formState: typeof state): FormError[] {
  const errors: FormError[] = []
  if (formState.username && !isValidUsername(formState.username)) {
    errors.push({ name: 'username', message: '3-30 characters: letters, numbers, underscores only.' })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  submitError.value = ''
  successMessage.value = ''
  submitting.value = true
  try {
    const socials: Record<string, unknown> = {}
    for (const field of SOCIAL_FIELDS) {
      const value = event.data.socials[field.key]?.trim()
      if (value) socials[field.key] = value
    }

    await updateProfile({
      fullName: event.data.fullName.trim() || null,
      username: event.data.username.trim() || null,
      bio: event.data.bio.trim() || null,
      location: event.data.location.trim() || null,
      website: event.data.website.trim() || null,
      socials,
    })
    await refresh()
    successMessage.value = 'Profile updated.'
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Failed to update profile.'
  } finally {
    submitting.value = false
  }
}

async function handleSignOut() {
  signingOut.value = true
  try {
    await signOut()
    await navigateTo('/')
  } finally {
    signingOut.value = false
  }
}

useSeoMeta({
  title: 'Edit profile — Zelp',
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-5 py-8">
    <h1 class="text-ink mb-6 text-2xl font-semibold">
      Edit profile
    </h1>

    <div v-if="pending" class="flex flex-col gap-3">
      <USkeleton class="bg-ink-100 h-10 w-full" />
      <USkeleton class="bg-ink-100 h-10 w-full" />
      <USkeleton class="bg-ink-100 h-24 w-full" />
    </div>

    <template v-else>
      <!-- Avatar upload — saves immediately, independent of the form below. -->
      <div class="mb-8 flex items-center gap-4">
        <UploadWidget
          kind="avatars"
          :current-url="profile?.avatarUrl"
          shape="circle"
          size-class="size-20"
          label="profile photo"
          @uploaded="handleAvatarUploaded"
          @removed="handleAvatarRemoved"
        />
        <div class="flex flex-col">
          <span class="text-ink text-sm font-medium">Profile photo</span>
          <span class="text-ink-faint text-xs">JPEG, PNG, WEBP or GIF, up to 5MB.</span>
        </div>
      </div>

      <UAlert
        v-if="avatarError"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        :description="avatarError"
        class="mb-4"
      />

      <UAlert
        v-if="successMessage"
        color="success"
        variant="subtle"
        icon="i-lucide-check-circle"
        :description="successMessage"
        class="mb-4"
      />
      <UAlert
        v-if="submitError"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        title="Couldn't update profile"
        :description="submitError"
        class="mb-4"
      />

      <UForm :state="state" :validate="validate" class="flex flex-col gap-4" @submit="onSubmit">
        <UFormField label="Full name" name="fullName">
          <UInput v-model="state.fullName" placeholder="Your name" class="w-full" :disabled="submitting" />
        </UFormField>

        <UFormField label="Username" name="username" hint="Letters, numbers, underscores">
          <UInput v-model="state.username" placeholder="yourname" class="w-full" :disabled="submitting" />
        </UFormField>

        <UFormField label="Bio" name="bio">
          <UTextarea v-model="state.bio" :rows="3" :maxlength="500" placeholder="A little about you" class="w-full" :disabled="submitting" />
        </UFormField>

        <UFormField label="Location" name="location">
          <UInput v-model="state.location" placeholder="e.g. Harare, Zimbabwe" class="w-full" :disabled="submitting" />
        </UFormField>

        <UFormField label="Website" name="website">
          <UInput v-model="state.website" placeholder="https://yoursite.com" class="w-full" :disabled="submitting" />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField v-for="field in SOCIAL_FIELDS" :key="field.key" :label="field.label" :name="`socials.${field.key}`">
            <UInput v-model="state.socials[field.key]" :placeholder="field.placeholder" class="w-full" :disabled="submitting" />
          </UFormField>
        </div>

        <div>
          <UButton type="submit" label="Save changes" :loading="submitting" size="lg" />
        </div>
      </UForm>

      <!-- Account settings -->
      <section class="border-line mt-10 flex flex-col gap-3 border-t pt-6">
        <h2 class="text-ink text-lg font-semibold">
          Account
        </h2>
        <p class="text-ink-muted text-sm">
          Account-level actions — signing out and changing your password — live here, separate from your public profile details above.
        </p>

        <div class="flex flex-wrap items-center gap-2 pt-1">
          <UButton to="/forgot-password" label="Change password" icon="i-lucide-key-round" variant="outline" color="neutral" />
          <UButton label="Sign out" icon="i-lucide-log-out" variant="outline" color="neutral" :loading="signingOut" @click="handleSignOut" />
          <!-- Also reachable from the desktop Navbar; kept here too since the
               mobile bottom tab bar has no room for a 5th, non-route item. -->
          <UColorModeButton variant="outline" color="neutral" />
        </div>
      </section>
    </template>
  </div>
</template>
