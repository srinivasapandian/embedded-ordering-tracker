import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'xs' | 'sm' | 'md'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm disabled:hover:bg-primary-600',
  secondary:
    'bg-elev text-ink hover:bg-line/70 active:bg-line disabled:hover:bg-elev',
  outline:
    'border border-line-strong/70 bg-card text-ink hover:bg-elev active:bg-line/60 disabled:hover:bg-card',
  ghost: 'text-sub hover:bg-elev hover:text-ink active:bg-line/60',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm disabled:hover:bg-red-600',
}

const sizeClasses: Record<Size, string> = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-md',
  sm: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, disabled, className, children, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      className={cn(
        'focus-ring inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})

/** Square icon-only button. Provide aria-label. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & { 'aria-label': string }
>(function IconButton({ variant = 'ghost', size = 'md', className, ...rest }, ref) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(size === 'md' ? 'w-9 px-0' : size === 'sm' ? 'w-8 px-0' : 'w-7 px-0', className)}
      {...rest}
    />
  )
})
