/** 57.8% style percentage with one decimal. */
export function pct(part: number, total: number, decimals = 1): string {
  if (total === 0) return '0%'
  return `${((part / total) * 100).toFixed(decimals)}%`
}

export function pctNumber(part: number, total: number): number {
  if (total === 0) return 0
  return (part / total) * 100
}

/** Initials from a name: 'HBK Iselin' -> 'HI'. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Title-case a kebab/lower string: 'in-progress' -> 'In Progress'. */
export function titleCase(s: string): string {
  return s
    .split(/[-_\s]+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ')
}
