import { forwardRef, useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean
}

/** Styled checkbox with indeterminate support (used by table multi-select). */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate, className, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = !!indeterminate
  }, [indeterminate])

  return (
    <input
      type="checkbox"
      ref={(node) => {
        innerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className={cn(
        'focus-ring h-4 w-4 cursor-pointer rounded border-line-strong bg-card text-primary-600 accent-primary-600',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    />
  )
})
