/** Minimal, pragmatic email format check for client-side form validation. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Minimum password length enforced on signup/reset forms. */
export const MIN_PASSWORD_LENGTH = 8

/**
 * Username format check for `profiles.username` (unique column): letters,
 * numbers, underscores, 3-30 characters. Uniqueness itself can't be
 * validated client-side without a round trip — that's surfaced instead as a
 * friendly message on the Postgres `23505` conflict (see `useProfile.ts`).
 */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/i.test(username)
}
