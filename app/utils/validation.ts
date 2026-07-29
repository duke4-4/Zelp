/** Minimal, pragmatic email format check for client-side form validation. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Minimum password length enforced on signup/reset forms. */
export const MIN_PASSWORD_LENGTH = 8
