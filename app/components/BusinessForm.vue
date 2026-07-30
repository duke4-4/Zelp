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
// phases): image upload (business_images — Phase 6, actually lives on the
// /business/new and /business/edit/[id] pages around this form, not in it).
//
// Lat/lng are plain numeric inputs (kept — some owners will always know
// their exact coordinates and typing them is faster than panning a map),
// plus a "use my current location" button (fills them from the browser's
// Geolocation API), plus a LocationPicker map (drag/click a pin). All
// three write to the same state.lat/state.lng and stay in sync with each
// other — see LocationPicker.vue for how the map <-> form-state two-way
// sync avoids feeding back into itself.

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
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'tiktok', label: 'TikTok' },
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

// --- "Use my current location" (Phase 7) ---
// One-shot on-demand fetch (`immediate: false`) — this never asks for the
// permission until the owner explicitly clicks the button.
const { coords: geoCoords, error: geoError, resume: resumeGeolocation } = useGeolocation({ immediate: false })
const locatingMe = ref(false)
const geoErrorMessage = ref('')

watch(geoCoords, (coords) => {
  if (!locatingMe.value) return
  if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return
  // Rounded to ~11cm precision — plenty for a business location pin, and
  // avoids dumping the browser's full float precision into the field.
  state.lat = Math.round(coords.latitude * 1e6) / 1e6
  state.lng = Math.round(coords.longitude * 1e6) / 1e6
  locatingMe.value = false
})

watch(geoError, (error) => {
  if (!error) return
  locatingMe.value = false
  geoErrorMessage.value = error.code === 1 // GeolocationPositionError.PERMISSION_DENIED
    ? 'Location access was denied. You can still enter coordinates manually.'
    : 'Could not detect your location. You can still enter coordinates manually.'
})

function handleUseMyLocation() {
  if (!navigator.geolocation) {
    geoErrorMessage.value = 'Your browser doesn\'t support location detection.'
    return
  }
  geoErrorMessage.value = ''
  locatingMe.value = true
  resumeGeolocation()
}

// --- Map picker (dragging/clicking the LocationPicker pin) ---
// Sets both fields from a single event so lat/lng always change together,
// same as the geolocation handler above — never a partial update where
// only one of the two is momentarily out of sync with the other.
function handleLocationPicked(location: { lat: number, lng: number }) {
  state.lat = location.lat
  state.lng = location.lng
}

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
    <section class="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-5">
      <h2 class="text-ink text-lg font-semibold">
        Basic info
      </h2>

      <UFormField label="Business name" name="name" required>
        <UInput v-model="state.name" class="w-full" :disabled="submitting" />
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea v-model="state.description" :rows="4" :maxlength="2000" class="w-full" :disabled="submitting" />
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
    <section class="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-5">
      <h2 class="text-ink text-lg font-semibold">
        Contact
      </h2>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Phone" name="phone">
          <UInput v-model="state.phone" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="WhatsApp" name="whatsapp">
          <UInput v-model="state.whatsapp" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="Website" name="website">
          <UInput v-model="state.website" class="w-full" :disabled="submitting" />
        </UFormField>
      </div>
    </section>

    <!-- Location -->
    <section class="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-5">
      <h2 class="text-ink text-lg font-semibold">
        Location
      </h2>

      <UFormField label="Address" name="address">
        <UInput v-model="state.address" class="w-full" :disabled="submitting" />
      </UFormField>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="City" name="city">
          <UInput v-model="state.city" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="Province" name="province">
          <UInput v-model="state.province" class="w-full" :disabled="submitting" />
        </UFormField>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Latitude" name="lat" hint="Optional">
          <UInput v-model.number="state.lat" type="number" step="any" class="w-full" :disabled="submitting" />
        </UFormField>
        <UFormField label="Longitude" name="lng" hint="Optional">
          <UInput v-model.number="state.lng" type="number" step="any" class="w-full" :disabled="submitting" />
        </UFormField>
      </div>

      <!-- Map picker — an alternative to typing coordinates, not a
           replacement: dragging/clicking the pin here and editing the
           Latitude/Longitude fields above both update the same
           state.lat/state.lng, kept in sync in both directions by
           LocationPicker itself. Degrades to a plain "unavailable"
           message on its own if NUXT_PUBLIC_MAPBOX_TOKEN isn't set. -->
      <div class="flex flex-col gap-1.5">
        <span class="text-ink-faint text-xs font-medium tracking-wide uppercase">Or drop a pin</span>
        <div class="h-64 w-full sm:h-72">
          <LocationPicker
            :lat="state.lat"
            :lng="state.lng"
            :disabled="submitting"
            @update:location="handleLocationPicked"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <UButton
          label="Use my current location"
          icon="i-lucide-locate-fixed"
          variant="outline"
          color="neutral"
          size="sm"
          class="self-start"
          :loading="locatingMe"
          :disabled="submitting"
          @click="handleUseMyLocation"
        />
        <p v-if="geoErrorMessage" class="text-closed-500 text-xs">
          {{ geoErrorMessage }}
        </p>
        <p class="text-ink-faint text-xs">
          Sets latitude/longitude from your device's current location — useful when you're standing at the business.
        </p>
      </div>
    </section>

    <!-- Hours -->
    <section class="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-5">
      <h2 class="text-ink text-lg font-semibold">
        Hours
      </h2>

      <div class="flex flex-col divide-y divide-line">
        <div
          v-for="day in DAYS"
          :key="day.key"
          class="grid grid-cols-[88px_1fr] items-center gap-x-3 gap-y-2 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[96px_1fr_auto]"
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
    <section class="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-5">
      <h2 class="text-ink text-lg font-semibold">
        Social links
      </h2>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField v-for="field in SOCIAL_FIELDS" :key="field.key" :label="field.label" :name="`socials.${field.key}`">
          <UInput v-model="state.socials[field.key]" class="w-full" :disabled="submitting" />
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
