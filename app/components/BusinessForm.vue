<script setup lang="ts">
// Business create/edit form, shared by /business/new and
// /business/edit/[id]. Mode (create vs update) is inferred from whether
// `existingBusiness` is set, mirroring ReviewForm's own
// create-vs-edit-inference convention — and, like ReviewForm, this
// component owns its own mutation call (createBusiness/updateBusiness)
// rather than delegating that back up to the page, emitting `submitted`
// with the result so the caller can navigate.
//
// Deliberately NOT included here (out of scope for Phase 5, left for later
// phases): image upload (business_images — Phase 6), a map picker for
// lat/lng (Phase 7). Lat/lng are plain numeric inputs for now.

import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { OwnedBusinessDetail } from '~/composables/useOwnedBusinesses'

const props = defineProps<{
  existingBusiness?: OwnedBusinessDetail | null
}>()

const emit = defineEmits<{
  submitted: [result: { id: string, slug: string }]
}>()

const isEditMode = computed(() => !!props.existingBusiness)

const { data: categories, status: categoriesStatus } = useCategories()
const categoriesPending = computed(() => categoriesStatus.value === 'pending')

// --- Hours: one row per day, a "Closed" checkbox + open/close text
// fields. Stored as `{ [day]: 'Closed' | { open, close } }`, matching the
// shape `formatHoursValue` in business/[slug].vue already knows how to
// render — deliberately not a fancier hours editor than that.
const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

type DayKey = typeof DAYS[number]['key']
interface DayHoursState { closed: boolean, open: string, close: string }

function defaultHoursState(): Record<DayKey, DayHoursState> {
  const state = {} as Record<DayKey, DayHoursState>
  for (const day of DAYS) {
    state[day.key] = { closed: false, open: '09:00', close: '17:00' }
  }
  return state
}

function hoursStateFromRecord(hours: Record<string, unknown> | null | undefined): Record<DayKey, DayHoursState> {
  const state = defaultHoursState()
  if (!hours) return state
  for (const day of DAYS) {
    const value = hours[day.key]
    if (typeof value === 'string') {
      state[day.key] = { closed: true, open: '09:00', close: '17:00' }
    } else if (value && typeof value === 'object') {
      const range = value as Record<string, unknown>
      state[day.key] = {
        closed: false,
        open: typeof range.open === 'string' ? range.open : '09:00',
        close: typeof range.close === 'string' ? range.close : '17:00',
      }
    }
  }
  return state
}

function hoursStateToRecord(state: Record<DayKey, DayHoursState>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const day of DAYS) {
    const entry = state[day.key]
    result[day.key] = entry.closed ? 'Closed' : { open: entry.open, close: entry.close }
  }
  return result
}

// --- Socials: a handful of common platform URL fields, matching the shape
// `businesses.socials` jsonb already assumes elsewhere in the app.
const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourbusiness' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourbusiness' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/yourbusiness' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourbusiness' },
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
  name: props.existingBusiness?.name ?? '',
  description: props.existingBusiness?.description ?? '',
  phone: props.existingBusiness?.phone ?? '',
  whatsapp: props.existingBusiness?.whatsapp ?? '',
  email: props.existingBusiness?.email ?? '',
  website: props.existingBusiness?.website ?? '',
  address: props.existingBusiness?.address ?? '',
  city: props.existingBusiness?.city ?? '',
  province: props.existingBusiness?.province ?? '',
  lat: props.existingBusiness?.lat ?? null as number | null,
  lng: props.existingBusiness?.lng ?? null as number | null,
  categoryIds: [...(props.existingBusiness?.categoryIds ?? [])],
  hours: hoursStateFromRecord(props.existingBusiness?.hours),
  socials: socialsStateFromRecord(props.existingBusiness?.socials),
})

const submitting = ref(false)
const errorMessage = ref('')

const categoryItems = computed(() => (categories.value ?? []).map(category => ({ label: category.name, value: category.id })))

function validate(formState: typeof state): FormError[] {
  const errors: FormError[] = []
  if (!formState.name.trim()) {
    errors.push({ name: 'name', message: 'Business name is required.' })
  }
  if (formState.email && !isValidEmail(formState.email)) {
    errors.push({ name: 'email', message: 'Enter a valid email address.' })
  }
  if (formState.lat !== null && (formState.lat < -90 || formState.lat > 90)) {
    errors.push({ name: 'lat', message: 'Latitude must be between -90 and 90.' })
  }
  if (formState.lng !== null && (formState.lng < -180 || formState.lng > 180)) {
    errors.push({ name: 'lng', message: 'Longitude must be between -180 and 180.' })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  errorMessage.value = ''
  submitting.value = true
  try {
    const socials: Record<string, unknown> = {}
    for (const field of SOCIAL_FIELDS) {
      const value = event.data.socials[field.key]?.trim()
      if (value) socials[field.key] = value
    }

    const input = {
      name: event.data.name.trim(),
      description: event.data.description.trim() || null,
      phone: event.data.phone.trim() || null,
      whatsapp: event.data.whatsapp.trim() || null,
      email: event.data.email.trim() || null,
      website: event.data.website.trim() || null,
      address: event.data.address.trim() || null,
      city: event.data.city.trim() || null,
      province: event.data.province.trim() || null,
      lat: event.data.lat,
      lng: event.data.lng,
      hours: hoursStateToRecord(event.data.hours),
      socials,
      categoryIds: event.data.categoryIds,
    }

    let result: { id: string, slug: string }
    if (isEditMode.value && props.existingBusiness) {
      await updateBusiness(props.existingBusiness.id, input)
      result = { id: props.existingBusiness.id, slug: props.existingBusiness.slug }
    } else {
      result = await createBusiness(input)
    }

    emit('submitted', result)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UForm :state="state" :validate="validate" class="flex flex-col gap-8" @submit="onSubmit">
    <!-- Basic info -->
    <section class="flex flex-col gap-4">
      <h2 class="text-ink text-lg font-semibold">
        Basic info
      </h2>

      <UFormField label="Business name" name="name" required>
        <UInput v-model="state.name" placeholder="e.g. Mbare Fresh Produce" class="w-full" :disabled="submitting" />
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea v-model="state.description" :rows="4" :maxlength="2000" placeholder="What makes this business worth visiting?" class="w-full" :disabled="submitting" />
      </UFormField>

      <UFormField label="Categories" name="categoryIds">
        <USelectMenu
          v-model="state.categoryIds"
          :items="categoryItems"
          value-key="value"
          label-key="label"
          multiple
          :loading="categoriesPending"
          :disabled="submitting || categoryItems.length === 0"
          placeholder="Select categories"
          class="w-full"
        />
        <p v-if="!categoriesPending && categoryItems.length === 0" class="text-ink-faint mt-1 text-xs">
          No categories available yet.
        </p>
      </UFormField>
    </section>

    <!-- Contact -->
    <section class="flex flex-col gap-4">
      <h2 class="text-ink text-lg font-semibold">
        Contact
      </h2>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Phone" name="phone">
          <UInput v-model="state.phone" placeholder="+263 77 123 4567" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="WhatsApp" name="whatsapp">
          <UInput v-model="state.whatsapp" placeholder="+263 77 123 4567" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" placeholder="hello@business.co.zw" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="Website" name="website">
          <UInput v-model="state.website" placeholder="https://business.co.zw" class="w-full" :disabled="submitting" />
        </UFormField>
      </div>
    </section>

    <!-- Location -->
    <section class="flex flex-col gap-4">
      <h2 class="text-ink text-lg font-semibold">
        Location
      </h2>

      <UFormField label="Address" name="address">
        <UInput v-model="state.address" placeholder="Street address" class="w-full" :disabled="submitting" />
      </UFormField>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="City" name="city">
          <UInput v-model="state.city" placeholder="e.g. Harare" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="Province" name="province">
          <UInput v-model="state.province" placeholder="e.g. Harare Province" class="w-full" :disabled="submitting" />
        </UFormField>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Latitude" name="lat" hint="Optional — a map picker is coming in a later phase">
          <UInput v-model.number="state.lat" type="number" step="any" placeholder="-17.8292" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="Longitude" name="lng" hint="Optional">
          <UInput v-model.number="state.lng" type="number" step="any" placeholder="31.0522" class="w-full" :disabled="submitting" />
        </UFormField>
      </div>
    </section>

    <!-- Hours -->
    <section class="flex flex-col gap-4">
      <h2 class="text-ink text-lg font-semibold">
        Hours
      </h2>

      <div class="flex flex-col rounded-[18px] border border-line px-4">
        <div
          v-for="day in DAYS"
          :key="day.key"
          class="grid grid-cols-[88px_1fr] items-center gap-x-3 gap-y-2 border-b border-line py-3.5 last:border-b-0 sm:grid-cols-[96px_1fr_auto]"
        >
          <span class="text-ink text-sm font-medium">{{ day.label }}</span>

          <div class="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1">
            <template v-if="!state.hours[day.key].closed">
              <UInput v-model="state.hours[day.key].open" type="time" size="sm" :disabled="submitting" />
              <span class="text-ink-faint text-sm">to</span>
              <UInput v-model="state.hours[day.key].close" type="time" size="sm" :disabled="submitting" />
            </template>
            <span v-else class="text-ink-faint text-sm">—</span>
          </div>

          <UCheckbox v-model="state.hours[day.key].closed" label="Closed" :disabled="submitting" class="justify-self-start sm:justify-self-end" />
        </div>
      </div>
    </section>

    <!-- Socials -->
    <section class="flex flex-col gap-4">
      <h2 class="text-ink text-lg font-semibold">
        Social links
      </h2>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField v-for="field in SOCIAL_FIELDS" :key="field.key" :label="field.label" :name="`socials.${field.key}`">
          <UInput v-model="state.socials[field.key]" :placeholder="field.placeholder" class="w-full" :disabled="submitting" />
        </UFormField>
      </div>
    </section>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
      :description="errorMessage"
    />

    <div>
      <UButton
        type="submit"
        :label="isEditMode ? 'Save changes' : 'Create business'"
        :loading="submitting"
        size="lg"
      />
    </div>
  </UForm>
</template>
