import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { clamp } from '@/utils/format'
import { fmtDate, isOverdue } from '@/utils/date'
import { toast } from '@/store/toastStore'
import { Tooltip } from '@/components/common/Tooltip'

/* ------------------------------------------------------------------ */
/* Inline editable cells: value → click → borderless control → save.   */
/* Saves show a brief check + success toast; Escape/blur cancels.      */
/* ------------------------------------------------------------------ */

function useSaveFlash() {
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const flash = () => {
    setSaved(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 1400)
  }
  return { saved, flash }
}

function SavedCheck({ saved }: { saved: boolean }) {
  return (
    <AnimatePresence>
      {saved && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="inline-flex shrink-0"
        >
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
          <span className="sr-only">Saved</span>
        </motion.span>
      )}
    </AnimatePresence>
  )
}

interface TriggerProps {
  ariaLabel: string
  valueLabel: string
  disabled?: boolean
  disabledReason?: string
  saved: boolean
  onOpen: () => void
  children: React.ReactNode
  buttonRef: React.RefObject<HTMLButtonElement | null>
}

/** The read-view button every inline cell shows before editing. */
function InlineTrigger({ ariaLabel, valueLabel, disabled, disabledReason, saved, onOpen, children, buttonRef }: TriggerProps) {
  const button = (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      aria-label={`${ariaLabel}: ${valueLabel}. Activate to edit`}
      onClick={onOpen}
      className={cn(
        'focus-ring group/inline -mx-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 text-left transition-colors',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-elev',
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
      {!disabled && (
        <ChevronDown
          className="h-3 w-3 shrink-0 text-faint opacity-0 transition-opacity group-hover/inline:opacity-100 group-focus-visible/inline:opacity-100"
          aria-hidden
        />
      )}
      <SavedCheck saved={saved} />
    </button>
  )
  if (disabled && disabledReason) {
    return (
      <Tooltip content={disabledReason}>
        <span tabIndex={0} className="focus-ring inline-flex max-w-full rounded-md">
          {button}
        </span>
      </Tooltip>
    )
  }
  return button
}

/* --------------------------- Select cell --------------------------- */

export interface InlineOption {
  value: string
  label: string
}

interface InlineSelectCellProps {
  value: string
  options: InlineOption[]
  onSave: (value: string) => void
  ariaLabel: string
  /** Rich read-view (StatusBadge / PriorityBadge / avatar). Falls back to the option label. */
  display?: React.ReactNode
  disabled?: boolean
  disabledReason?: string
}

export function InlineSelectCell({
  value,
  options,
  onSave,
  ariaLabel,
  display,
  disabled,
  disabledReason,
}: InlineSelectCellProps) {
  const [editing, setEditing] = useState(false)
  const { saved, flash } = useSaveFlash()
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const label = options.find((o) => o.value === value)?.label ?? (value || '—')

  const close = () => {
    setEditing(false)
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  if (editing && !disabled) {
    return (
      <select
        autoFocus
        aria-label={ariaLabel}
        defaultValue={value}
        onChange={(e) => {
          const next = e.target.value
          if (next !== value) {
            onSave(next)
            toast.success('Changes saved')
            flash()
          }
          close()
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            close()
          }
        }}
        className="focus-ring h-7 max-w-full cursor-pointer rounded-md border-none bg-elev px-1.5 text-xs text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <InlineTrigger
      ariaLabel={ariaLabel}
      valueLabel={label}
      disabled={disabled}
      disabledReason={disabledReason}
      saved={saved}
      onOpen={() => setEditing(true)}
      buttonRef={buttonRef}
    >
      {display ?? <span className="text-sm text-ink">{label}</span>}
    </InlineTrigger>
  )
}

/* ---------------------------- Date cell ---------------------------- */

interface InlineDateCellProps {
  /** ISO date ('yyyy-MM-dd' or full ISO). */
  value: string
  onSave: (isoDate: string) => void
  ariaLabel: string
  /** Tint the date red when it is in the past. */
  warnOverdue?: boolean
  disabled?: boolean
  disabledReason?: string
}

export function InlineDateCell({
  value,
  onSave,
  ariaLabel,
  warnOverdue = false,
  disabled,
  disabledReason,
}: InlineDateCellProps) {
  const [editing, setEditing] = useState(false)
  const { saved, flash } = useSaveFlash()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const settled = useRef(false)

  const dateOnly = value.slice(0, 10)
  const overdue = warnOverdue && isOverdue(value)

  const close = () => {
    setEditing(false)
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  const commit = (raw: string) => {
    if (settled.current) return
    settled.current = true
    if (raw && raw !== dateOnly) {
      onSave(raw)
      toast.success('Changes saved')
      flash()
    }
    close()
  }

  if (editing && !disabled) {
    return (
      <input
        type="date"
        autoFocus
        aria-label={ariaLabel}
        defaultValue={dateOnly}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit((e.target as HTMLInputElement).value)
          }
          if (e.key === 'Escape') {
            e.stopPropagation()
            settled.current = true
            close()
          }
        }}
        className="focus-ring h-7 w-[8.5rem] cursor-pointer rounded-md border-none bg-elev px-1.5 text-xs text-ink"
      />
    )
  }
  if (settled.current) settled.current = false

  return (
    <InlineTrigger
      ariaLabel={ariaLabel}
      valueLabel={fmtDate(value)}
      disabled={disabled}
      disabledReason={disabledReason}
      saved={saved}
      onOpen={() => setEditing(true)}
      buttonRef={buttonRef}
    >
      <span className={cn('whitespace-nowrap text-sm tabular-nums', overdue ? 'font-medium text-red-500' : 'text-ink')}>
        {fmtDate(value)}
        {overdue && <span className="sr-only"> (overdue)</span>}
      </span>
    </InlineTrigger>
  )
}

/* --------------------------- Number cell --------------------------- */

interface InlineNumberCellProps {
  value: number
  onSave: (value: number) => void
  ariaLabel: string
  min?: number
  max?: number
  suffix?: string
  /** Draw a tiny progress bar next to the number (used for migration %). */
  showBar?: boolean
  disabled?: boolean
  disabledReason?: string
}

export function InlineNumberCell({
  value,
  onSave,
  ariaLabel,
  min = 0,
  max = 100,
  suffix = '%',
  showBar = false,
  disabled,
  disabledReason,
}: InlineNumberCellProps) {
  const [editing, setEditing] = useState(false)
  const { saved, flash } = useSaveFlash()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const settled = useRef(false)

  const close = () => {
    setEditing(false)
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  const commit = (raw: string) => {
    if (settled.current) return
    settled.current = true
    const parsed = Number(raw)
    if (raw !== '' && Number.isFinite(parsed)) {
      const next = clamp(Math.round(parsed), min, max)
      if (next !== value) {
        onSave(next)
        toast.success('Changes saved')
        flash()
      }
    }
    close()
  }

  if (editing && !disabled) {
    return (
      <input
        type="number"
        autoFocus
        aria-label={ariaLabel}
        min={min}
        max={max}
        defaultValue={value}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit((e.target as HTMLInputElement).value)
          }
          if (e.key === 'Escape') {
            e.stopPropagation()
            settled.current = true
            close()
          }
        }}
        className="focus-ring h-7 w-16 rounded-md border-none bg-elev px-1.5 text-xs tabular-nums text-ink"
      />
    )
  }
  if (settled.current) settled.current = false

  return (
    <InlineTrigger
      ariaLabel={ariaLabel}
      valueLabel={`${value}${suffix}`}
      disabled={disabled}
      disabledReason={disabledReason}
      saved={saved}
      onOpen={() => setEditing(true)}
      buttonRef={buttonRef}
    >
      <span className="inline-flex items-center gap-2">
        <span className="text-sm tabular-nums text-ink">
          {value}
          {suffix}
        </span>
        {showBar && (
          <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-elev" aria-hidden>
            <span
              className={cn('block h-full rounded-full', value >= 100 ? 'bg-emerald-500' : 'bg-primary-500')}
              style={{ width: `${clamp(value, 0, 100)}%` }}
            />
          </span>
        )}
      </span>
    </InlineTrigger>
  )
}
