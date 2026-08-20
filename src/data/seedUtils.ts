/** Shared helpers for deterministic-ish seed generation. */

export function daysAgoIso(days: number, hourOfDay = 10, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hourOfDay, minute, 0, 0)
  return d.toISOString()
}

export function daysFromNowIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

/** Small deterministic PRNG so seed data is stable within a session. */
export function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
