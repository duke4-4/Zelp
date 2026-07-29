/**
 * Converts a business name into a URL-safe slug base (lowercase words
 * joined by hyphens, accents stripped). This does NOT guarantee
 * uniqueness against `businesses.slug` (unique column) — see
 * `generateUniqueSlug` in `useOwnedBusinesses.ts`, which calls this and
 * then checks/retries with a numeric suffix on collision.
 */
export function slugify(input: string): string {
  // Strips the combining-diacritical-marks block (U+0300-U+036F) left
  // behind by NFKD normalization, e.g. turning "e" + acute-accent into
  // plain "e". Built via `new RegExp` from an escaped string literal
  // (rather than a `/.../ ` literal) so this source file stays plain ASCII.
  const combiningMarks = new RegExp('[\\u0300-\\u036f]', 'g')

  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(combiningMarks, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || 'business'
}
