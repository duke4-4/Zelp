/**
 * Generic image upload/delete helper for the `uploads` storage bucket
 * (Phase 6). See supabase/migrations/0005_storage.sql for the bucket +
 * policies: a single public bucket, path convention
 * `{kind}/{owner_id}/{filename}`, where `owner_id` must be `auth.uid()` for
 * every kind — including business assets (logo/cover/gallery), which are
 * keyed by the *owning profile's* id, not the business id, so the same
 * storage policy check works uniformly for every asset type.
 *
 * `UploadKind` here is the storage *folder* name and is deliberately
 * distinct from `BusinessImageKind` (the `business_images.kind` column,
 * `'logo' | 'cover' | 'gallery'`) — the storage bucket comment names its
 * folders in the plural (`avatars`, `logos`, `covers`, `gallery`).
 */

export type UploadKind = 'avatars' | 'logos' | 'covers' | 'gallery'

export interface UploadResult {
  /** Storage object path, e.g. `avatars/<uid>/171234-abcd.jpg`. */
  path: string
  /** Public URL for the uploaded object. */
  url: string
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** Normalizes a Supabase Storage error into a friendly, user-facing `Error`. */
function toUploadError(error: unknown): Error {
  if (error instanceof Error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message))
  }
  return new Error('Upload failed. Please try again.')
}

/** Rejects anything that isn't a real, reasonably-sized image file. */
function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    throw new Error('Please upload a JPEG, PNG, WEBP or GIF image.')
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('That image is too large — please upload a file under 5MB.')
  }
}

/** Prefers the file's own extension, falling back to one derived from its
 * validated MIME type (some camera/gallery pickers hand back extension-less
 * filenames). */
function extensionFromFile(file: File): string {
  const fromName = file.name.split('.').pop()
  if (fromName && /^[a-z0-9]{2,5}$/i.test(fromName)) return fromName.toLowerCase()
  return EXTENSION_BY_MIME[file.type] ?? 'jpg'
}

/**
 * Extracts the storage object path from either a bare path or a full public
 * URL (`{SUPABASE_URL}/storage/v1/object/public/uploads/{path}`), so delete
 * calls can accept whatever a caller already has on hand. Returns `null` for
 * anything that isn't recognizably an `uploads` bucket object.
 */
function extractStoragePath(pathOrUrl: string): string | null {
  if (!pathOrUrl) return null
  const marker = '/object/public/uploads/'
  const markerIndex = pathOrUrl.indexOf(marker)
  if (markerIndex !== -1) {
    return decodeURIComponent(pathOrUrl.slice(markerIndex + marker.length))
  }
  // Not a URL at all — treat it as an already-bare storage path.
  if (!pathOrUrl.startsWith('http')) return pathOrUrl
  // A URL that isn't one of our own public object URLs — nothing to delete.
  return null
}

export function useUpload() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * Validates, then uploads `file` to `{kind}/{auth.uid()}/{collision-safe filename}`
   * and returns its storage path + public URL. Throws a friendly `Error` on
   * an invalid file or a failed upload — never swallows a real failure.
   */
  async function uploadImage(kind: UploadKind, file: File): Promise<UploadResult> {
    if (!user.value) throw new Error('You need to be signed in to upload images.')
    validateImageFile(file)

    const extension = extensionFromFile(file)
    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`
    const path = `${kind}/${user.value.id}/${filename}`

    const { error } = await supabase.storage
      .from('uploads')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })

    if (error) throw toUploadError(error)

    const { data } = supabase.storage.from('uploads').getPublicUrl(path)
    return { path, url: data.publicUrl }
  }

  /**
   * Deletes a previously-uploaded object, accepting either its bare storage
   * path or its full public URL. A no-op (not an error) for anything that
   * doesn't resolve to a recognizable `uploads` bucket path, so callers can
   * pass arbitrary/legacy URLs defensively.
   */
  async function removeImage(pathOrUrl: string): Promise<void> {
    const path = extractStoragePath(pathOrUrl)
    if (!path) return

    const { error } = await supabase.storage.from('uploads').remove([path])
    if (error) throw toUploadError(error)
  }

  return { uploadImage, removeImage }
}
