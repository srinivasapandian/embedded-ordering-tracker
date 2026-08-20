import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'focus-ring h-9 w-full rounded-lg border border-line-strong/70 bg-card px-3 text-sm text-ink placeholder:text-faint transition-colors',
        'hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60',
        invalid && 'border-red-500 focus-visible:ring-red-500',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'focus-ring w-full rounded-lg border border-line-strong/70 bg-card px-3 py-2 text-sm text-ink placeholder:text-faint transition-colors',
        'hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60',
        invalid && 'border-red-500 focus-visible:ring-red-500',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})
