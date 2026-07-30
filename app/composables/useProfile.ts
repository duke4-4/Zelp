import type { Database, Json } from '~~/types/database.types'

/**
 * Current user's own profile (Phase 5). Reads of `profiles` are actually
 * public under RLS (`profiles_select_all` — reviewer/owner names need to
 * render on public pages), but this composable is scoped to "my profile"
 * specifically: `/profile` and `/profile/edit` only ever show/edit the
 * signed-in user's own row, there's no public "view someone else's
 * profile" route in this phase. Writes are restricted by RLS to
 * `auth.uid() = id`.
 */

export interface ProfileDetail {
  id: string
  username: string | null
  fullName: string | null
  bio: string | null
  avatarUrl: string | null
  location: string | null
  website: string | null
  socials: Record<string, unknown>
  createdAt: string
  updatedAt: string | null
}

export interface ProfileUpdateInput {
  username: string | null
  fullName: string | null
  bio: string | null
  location: string | null
  website: string | null
  socials: Record<string, unknown>
}

const PROFILE_SELECT = 'id, username, full_name, bio, avatar_url, location, website, socials, created_at, updated_at'

interface RawProfileRow {
  id: string
  username: string | null
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  socials: Json
  created_at: string
  updated_at: string | null
}

function mapProfileRow(row: RawProfileRow): ProfileDetail {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    location: row.location,
    website: row.website,
    socials: (row.socials ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Normalizes a Supabase/Postgres error from a profile mutation into a
 * friendly, user-facing message. `23505` (unique_violation) here can only
 * be the `profiles.username` unique constraint — the only unique column a
 * client write can hit.
 */
function toProfileError(error: unknown): Error {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    if (code === '23505') {
      return new Error('That username is taken. Please choose another.')
    }
  }
  if (error instanceof Error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message))
  }
  return new Error('Something went wrong. Please try again.')
}

/**
 * The signed-in user's own profile row. Resolves to `null` (not an error)
 * when signed out, or in the unlikely event the row doesn't exist yet.
 */
export function useMyProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  return useAsyncData(
    () => `my-profile:${user.value?.id ?? 'anon'}`,
    async () => {
      if (!user.value) return null

      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', user.value.id)
        .maybeSingle()
        .overrideTypes<RawProfileRow, { merge: false }>()

      if (error) throw error
      return data ? mapProfileRow(data) : null
    },
    {
      default: () => null as ProfileDetail | null,
      watch: [() => user.value?.id],
    },
  )
}

/**
 * Updates the signed-in user's own profile. Uses `upsert` (rather than a
 * plain `update`) so this also self-heals the rare case where the
 * `handle_new_user()` trigger's profile row is somehow missing — RLS's
 * `profiles_insert_own` / `profiles_update_own` policies both key off
 * `auth.uid() = id`, so either insert or update path is equally safe here.
 * Throws a friendly `Error` on failure, notably on a `23505` username
 * conflict (see `toProfileError`).
 */
export async function updateProfile(input: ProfileUpdateInput): Promise<ProfileDetail> {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  if (!user.value) throw new Error('You need to be signed in to update your profile.')

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.value.id,
        username: input.username,
        full_name: input.fullName,
        bio: input.bio,
        location: input.location,
        website: input.website,
        socials: input.socials as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select(PROFILE_SELECT)
    .single()
    .overrideTypes<RawProfileRow, { merge: false }>()

  if (error) throw toProfileError(error)
  return mapProfileRow(data)
}

/**
 * Updates only the signed-in user's `avatar_url` (Phase 6) — kept separate
 * from `updateProfile` so uploading/replacing/removing a photo via
 * `UploadWidget` can save immediately, without needing the rest of the
 * profile-edit form's fields or its own submit step. RLS restricts this to
 * `auth.uid() = id`, same as `updateProfile`.
 */
export async function updateProfileAvatar(avatarUrl: string | null): Promise<void> {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  if (!user.value) throw new Error('You need to be signed in to update your profile.')

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.value.id)

  if (error) throw toProfileError(error)
}
