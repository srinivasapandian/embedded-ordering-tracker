/**
 * Deterministic, presentation-only "mock" values for fields that still don't
 * exist on the real data model (legacy CMS tech counts on the Tech Landscape
 * chart). Never persisted — derived at render time from a stable id so the
 * same record always shows the same mock value.
 *
 * Environment, QA sign-off and per-client capability rollout used to live
 * here as hash-derived mocks; they are now real, admin-editable fields on
 * Website/Client (see src/types/index.ts) and seeded once in src/data via
 * `mockRatio` below so the initial values look the same as before.
 */

export function hashString(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Stable 0..1 float for an id — used to size mock chart segments consistently. */
export function mockRatio(id: string, salt = ''): number {
  return (hashString(id + salt) % 1000) / 1000
}
