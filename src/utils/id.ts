let counter = 0

/** Generate a reasonably unique id with a readable prefix, e.g. `cl-m3k9x-4`. */
export function uid(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}-${counter}`
}
