import { cn } from '@/utils/cn'

/** Keyboard shortcut hint chip, e.g. <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-elev px-1 font-sans text-2xs font-medium text-sub',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
