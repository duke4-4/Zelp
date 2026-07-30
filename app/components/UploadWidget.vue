<script setup lang="ts">
// Reusable drag-and-drop-or-click image upload slot (Phase 6). Single-slot
// by design — one instance shows/replaces/removes exactly one image — so
// avatar/logo/cover use one instance each, and a gallery is simply several
// instances rendered in a loop (one per existing photo, plus one empty
// "add" instance for uploading a new one; see business/new.vue and
// business/edit/[id].vue).
//
// Ownership split: this component owns the *storage* side of things
// (upload the new file, best-effort delete the file it's replacing/losing)
// and reports the outcome via events. It never touches any database table
// itself — the *database* row (profiles.avatar_url, a business_images row,
// etc) is always the caller's responsibility, since only the caller knows
// what that row should look like.
//
// Empty/loading/error states never show placeholder imagery — with nothing
// uploaded, this renders a genuine dashed empty state (per the project's
// no-mock-content rule), matching the dashed-square "Add photo" tile in
// docs/reference/zelp-v2-prototype.html's `.photo-tiles .add`.

import type { UploadKind, UploadResult } from '~/composables/useUpload'

const props = withDefaults(defineProps<{
  kind: UploadKind
  /** The currently-saved image URL, if any. `null`/unset renders the empty "add" state. */
  currentUrl?: string | null
  shape?: 'circle' | 'square'
  /** CSS `aspect-ratio` value, e.g. `'1/1'`, `'16/9'`, `'3/1'`. Ignored for `shape="circle"` (always 1/1). */
  aspectRatio?: string
  /** Tailwind width class(es) for the widget's footprint — the height follows from `aspectRatio`. */
  sizeClass?: string
  /** Used for alt text and the empty-state label/aria-label. */
  label?: string
  disabled?: boolean
}>(), {
  currentUrl: null,
  shape: 'square',
  aspectRatio: '1/1',
  sizeClass: 'w-full',
  label: 'photo',
  disabled: false,
})

const emit = defineEmits<{
  uploaded: [result: UploadResult]
  removed: []
}>()

const { uploadImage, removeImage } = useUpload()

const previewUrl = ref<string | null>(props.currentUrl ?? null)
watch(() => props.currentUrl, (value) => { previewUrl.value = value ?? null })

const uploading = ref(false)
const isDragging = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function openPicker() {
  if (props.disabled || uploading.value) return
  fileInput.value?.click()
}

async function handleFile(file: File) {
  error.value = ''
  uploading.value = true
  const previousUrl = previewUrl.value

  try {
    const result = await uploadImage(props.kind, file)
    previewUrl.value = result.url
    emit('uploaded', result)

    // Delete-on-replace hygiene: best-effort only, never blocks the
    // already-successful upload the user is waiting on.
    if (previousUrl) {
      try {
        await removeImage(previousUrl)
      } catch (cleanupError) {
        console.warn('[UploadWidget] Failed to remove replaced file from storage:', cleanupError)
      }
    }
  } catch (uploadCatchError) {
    error.value = uploadCatchError instanceof Error ? uploadCatchError.message : 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

function handleInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (file) void handleFile(file)
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (props.disabled || uploading.value) return
  const file = event.dataTransfer?.files?.[0]
  if (file) void handleFile(file)
}

async function handleRemoveClick() {
  if (!previewUrl.value || uploading.value) return
  error.value = ''
  const removedUrl = previewUrl.value
  previewUrl.value = null
  emit('removed')

  try {
    await removeImage(removedUrl)
  } catch (cleanupError) {
    console.warn('[UploadWidget] Failed to delete removed file from storage:', cleanupError)
  }
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div
      class="group border-line relative overflow-hidden border transition"
      :class="[
        sizeClass,
        shape === 'circle' ? 'rounded-full' : 'rounded-[14px]',
        !previewUrl ? 'border-dashed hover:border-flame-400' : 'border-solid',
        isDragging ? 'border-flame-500 bg-flame-tint' : (previewUrl ? '' : 'bg-stone'),
        disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer',
      ]"
      :style="{ aspectRatio: shape === 'circle' ? '1/1' : aspectRatio }"
      role="button"
      tabindex="0"
      :aria-label="previewUrl ? `Replace ${label}` : `Upload ${label}`"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <NuxtImg
        v-if="previewUrl"
        :src="previewUrl"
        :alt="label"
        class="h-full w-full object-cover"
      />
      <div v-else class="text-ink-faint flex h-full w-full flex-col items-center justify-center gap-1.5 p-3 text-center">
        <UIcon name="i-lucide-image-plus" class="size-6" />
        <span class="text-xs font-medium">Add {{ label }}</span>
      </div>

      <div v-if="uploading" class="bg-surface/85 absolute inset-0 flex items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="text-flame-500 size-6 animate-spin" />
      </div>

      <div
        v-if="previewUrl && !uploading"
        class="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/45 via-transparent to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
      >
        <button
          type="button"
          class="bg-surface/90 text-ink flex size-7 items-center justify-center rounded-full shadow-[var(--shadow-resting)] transition hover:scale-105"
          :aria-label="`Replace ${label}`"
          @click.stop="openPicker"
        >
          <UIcon name="i-lucide-pencil" class="size-3.5" />
        </button>
        <button
          type="button"
          class="bg-surface/90 text-closed-500 flex size-7 items-center justify-center rounded-full shadow-[var(--shadow-resting)] transition hover:scale-105"
          :aria-label="`Remove ${label}`"
          @click.stop="handleRemoveClick"
        >
          <UIcon name="i-lucide-trash-2" class="size-3.5" />
        </button>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="handleInputChange"
    >

    <p v-if="error" class="text-closed-500 text-xs">
      {{ error }}
    </p>
  </div>
</template>
