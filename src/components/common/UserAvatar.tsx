import { initials } from '@/utils/format'
import { cn } from '@/utils/cn'
import { Tooltip } from './Tooltip'

/** Structural shape — satisfied by both `TeamMember` and the Firebase-backed `UserProfile`. */
interface AvatarMember {
  name: string
  color: string
  title?: string
}

interface UserAvatarProps {
  member?: AvatarMember | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Render the name (and optionally title) next to the avatar. */
  showName?: boolean
  showTitle?: boolean
  /** Wrap the bare avatar in a tooltip with the member name. */
  tooltip?: boolean
  className?: string
}

const sizeClasses = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-2xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
}

export function UserAvatar({
  member,
  size = 'md',
  showName = false,
  showTitle = false,
  tooltip = false,
  className,
}: UserAvatarProps) {
  const circle = (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        sizeClasses[size],
        member ? member.color : 'bg-line-strong text-sub',
      )}
      aria-hidden={showName}
    >
      {member ? initials(member.name) : '—'}
    </span>
  )

  const avatar = tooltip && member && !showName ? (
    <Tooltip content={member.name}>{circle}</Tooltip>
  ) : (
    circle
  )

  if (!showName) {
    return <span className={cn('inline-flex', className)}>{avatar}</span>
  }

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      {avatar}
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-medium text-ink">
          {member ? member.name : 'Unassigned'}
        </span>
        {showTitle && member && <span className="block truncate text-xs text-sub">{member.title}</span>}
      </span>
    </span>
  )
}
