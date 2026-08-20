import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  'aria-label': string
  size?: 'sm' | 'md'
  className?: string
}

/** Animated toggle switch (role="switch"). */
export function Switch({ checked, onChange, disabled, size = 'md', className, ...aria }: SwitchProps) {
  const dims = size === 'md' ? 'h-5 w-9' : 'h-4 w-7'
  const knob = size === 'md' ? 'h-4 w-4' : 'h-3 w-3'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={aria['aria-label']}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring relative inline-flex shrink-0 cursor-pointer items-center rounded-full px-0.5 transition-colors duration-200',
        dims,
        checked ? 'bg-primary-600' : 'bg-line-strong',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 550, damping: 32 }}
        className={cn('block rounded-full bg-white shadow-sm', knob, checked && 'ml-auto')}
      />
    </button>
  )
}
