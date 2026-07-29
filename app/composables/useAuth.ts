/**
 * Thin wrapper around the `@nuxtjs/supabase` auth client.
 *
 * Every method here either resolves with the Supabase response `data`
 * or throws an `Error` whose `.message` is the (human-readable) message
 * Supabase returned — callers should wrap calls in try/catch and display
 * `error.message` directly rather than swallowing failures.
 */
export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /** Normalizes anything thrown/returned as an error into a plain Error with a usable message. */
  const toError = (error: unknown): Error => {
    if (error instanceof Error) return error
    if (error && typeof error === 'object' && 'message' in error) {
      return new Error(String((error as { message: unknown }).message))
    }
    return new Error('Something went wrong. Please try again.')
  }

  /** Builds an absolute URL back to this site, usable on both server and client. */
  const buildRedirectUrl = (path: string): string => {
    const requestUrl = useRequestURL()
    return new URL(path, requestUrl.origin).toString()
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw toError(error)
    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw toError(error)
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw toError(error)
  }

  /** Sends a password-reset email with a link back to `/reset-password` on this site. */
  const requestPasswordReset = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildRedirectUrl('/reset-password'),
    })
    if (error) throw toError(error)
    return data
  }

  /** Sets a new password for the currently-authenticated (recovery) session. */
  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw toError(error)
    return data
  }

  return {
    user,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
  }
}
