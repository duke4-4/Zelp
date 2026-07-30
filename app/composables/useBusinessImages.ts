import type { Database, BusinessImageKind } from '~~/types/database.types'
import type { BusinessImageLite } from '~/composables/useBusinesses'

/**
 * `business_images` row mutations for business owners (Phase 6). Reads
 * already come from `useOwnedBusinesses.ts` (embedded on `OwnedBusinessDetail.images`)
 * — this file only covers the write side: upserting the single logo/cover
 * row, appending a gallery row, and deleting one. RLS
 * (`business_images_insert_own` / `_update_own` / `_delete_own`, see
 * supabase/migrations/0004_rls_policies.sql) restricts every write here to
 * businesses owned by the caller.
 *
 * Storage cleanup (deleting the actual file an old/removed row pointed at)
 * is NOT this file's job — `UploadWidget` already handles that itself via
 * `useUpload`'s `removeImage`. This file only ever touches the
 * `business_images` table.
 */

const IMAGE_SELECT = 'id, url, kind, position'

interface RawBusinessImageRow {
  id: string
  url: string
  kind: BusinessImageKind
  position: number
}

/** Normalizes a Supabase/Postgres error from a `business_images` mutation. */
function toImageError(error: unknown): Error {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    if (code === '42501') {
      return new Error('You don\'t have permission to do that.')
    }
  }
  if (error instanceof Error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message))
  }
  return new Error('Something went wrong. Please try again.')
}

/**
 * Sets a business's single logo/cover image: updates the existing row of
 * that kind if one exists, otherwise inserts a new one — so
 * uploading/replacing a logo or cover never leaves a duplicate row behind.
 */
export async function upsertSingleBusinessImage(
  businessId: string,
  kind: Extract<BusinessImageKind, 'logo' | 'cover'>,
  url: string,
): Promise<BusinessImageLite> {
  const supabase = useSupabaseClient<Database>()

  const { data: existing, error: findError } = await supabase
    .from('business_images')
    .select('id')
    .eq('business_id', businessId)
    .eq('kind', kind)
    .maybeSingle()
  if (findError) throw toImageError(findError)

  if (existing) {
    const { data, error } = await supabase
      .from('business_images')
      .update({ url })
      .eq('id', existing.id)
      .select(IMAGE_SELECT)
      .single()
      .overrideTypes<RawBusinessImageRow, { merge: false }>()
    if (error) throw toImageError(error)
    return data
  }

  const { data, error } = await supabase
    .from('business_images')
    .insert({ business_id: businessId, kind, url, position: 0 })
    .select(IMAGE_SELECT)
    .single()
    .overrideTypes<RawBusinessImageRow, { merge: false }>()
  if (error) throw toImageError(error)
  return data
}

/** Appends a new gallery image at the given position (simple append-at-end — see caller). */
export async function addGalleryImage(businessId: string, url: string, position: number): Promise<BusinessImageLite> {
  const supabase = useSupabaseClient<Database>()

  const { data, error } = await supabase
    .from('business_images')
    .insert({ business_id: businessId, kind: 'gallery', url, position })
    .select(IMAGE_SELECT)
    .single()
    .overrideTypes<RawBusinessImageRow, { merge: false }>()

  if (error) throw toImageError(error)
  return data
}

/** Updates an existing image row's URL in place — used when replacing one gallery photo with another. */
export async function updateBusinessImageUrl(imageId: string, url: string): Promise<void> {
  const supabase = useSupabaseClient<Database>()

  const { error } = await supabase
    .from('business_images')
    .update({ url })
    .eq('id', imageId)

  if (error) throw toImageError(error)
}

/** Deletes an image row (the caller is responsible for also deleting the underlying storage object). */
export async function deleteBusinessImage(imageId: string): Promise<void> {
  const supabase = useSupabaseClient<Database>()

  const { error } = await supabase
    .from('business_images')
    .delete()
    .eq('id', imageId)

  if (error) throw toImageError(error)
}
