import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  format,
  isBefore,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'

/** 'Aug 20, 2026' */
export function fmtDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy')
}

/** 'Aug 20, 2026 12:42 PM' */
export function fmtDateTime(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy h:mm a')
}

/** '10:42 AM' */
export function fmtTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a')
}

/** 'Thursday, August 20, 2026' */
export function fmtFullDate(date: Date = new Date()): string {
  return format(date, 'EEEE, MMMM d, yyyy')
}

/** 'Today' | 'Yesterday' | 'Aug 18' — used by activity timelines. */
export function relativeDay(iso: string): string {
  const diff = differenceInCalendarDays(new Date(), parseISO(iso))
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return format(parseISO(iso), 'MMM d')
}

/** 'just now' | '5m ago' | '2h ago' | '3d ago' — used by notifications. */
export function timeAgo(iso: string): string {
  const ms = Date.now() - parseISO(iso).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(iso)
}

/* ------------------------------------------------------------------ */
/* Week helpers — weeks start on Monday and are keyed 'yyyy-MM-dd'.    */
/* ------------------------------------------------------------------ */

/** Monday of the week containing `date`, as a 'yyyy-MM-dd' key. */
export function weekKeyOf(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/** Shift a week key by n weeks. */
export function shiftWeekKey(weekKey: string, n: number): string {
  return format(addWeeks(parseISO(weekKey), n), 'yyyy-MM-dd')
}

/** 'August 3rd Week' — ordinal week of the month for the Monday of the week. */
export function weekLabel(weekKey: string): string {
  const monday = parseISO(weekKey)
  const n = Math.ceil(monday.getDate() / 7)
  const ord = n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
  return `${format(monday, 'MMMM')} ${ord} Week`
}

/** 'Aug 17 – Aug 23' range label for a week key. */
export function weekRangeLabel(weekKey: string): string {
  const monday = parseISO(weekKey)
  return `${format(monday, 'MMM d')} – ${format(addDays(monday, 6), 'MMM d')}`
}

/** True when the ISO date is strictly before today. */
export function isOverdue(iso: string): boolean {
  return isBefore(parseISO(iso), startOfDay(new Date()))
}

/** ISO date string n days from now (date only). */
export function isoDaysFromNow(n: number): string {
  return format(addDays(new Date(), n), 'yyyy-MM-dd')
}

/** Full ISO timestamp n minutes ago. */
export function isoMinutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString()
}
