import { useNavigate } from 'react-router-dom'
import { LogOut, Moon, RotateCcw, Search, Settings, Sun, User } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useUiStore } from '@/store/uiStore'
import { useTheme } from '@/context/ThemeContext'
import { toast } from '@/store/toastStore'
import { Kbd } from '@/components/common/Kbd'
import { Tooltip } from '@/components/common/Tooltip'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { UserAvatar } from '@/components/common/UserAvatar'
import { ROLE_LABELS } from '@/types'
import { Breadcrumbs } from './Breadcrumbs'
import { NotificationsPopover } from './NotificationsPopover'

export function Topbar() {
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const { theme, toggleTheme } = useTheme()
  const currentUser = useAppStore((s) => s.teamMembers.find((m) => m.id === s.currentUserId))
  const resetAll = useAppStore((s) => s.resetAll)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-card px-5">
      <Breadcrumbs />

      <div className="flex items-center gap-1.5">
        {/* Global search / command palette trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="focus-ring group hidden h-9 w-64 items-center gap-2 rounded-lg border border-line bg-elev/60 px-3 text-sm text-faint transition-colors hover:border-line-strong hover:text-sub md:flex"
          aria-label="Open global search (Ctrl+K)"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="flex-1 text-left">Search anything…</span>
          <span className="flex items-center gap-0.5">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <Tooltip content="Search (Ctrl+K)" side="bottom">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Open global search"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-sub transition-colors hover:bg-elev hover:text-ink md:hidden"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </Tooltip>

        <NotificationsPopover />

        <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} side="bottom">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-sub transition-colors hover:bg-elev hover:text-ink"
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
          </button>
        </Tooltip>

        {/* Profile dropdown */}
        <DropdownMenu
          align="end"
          trigger={(props) => (
            <button
              type="button"
              {...props}
              className="focus-ring ml-1 flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-elev"
              aria-label="Open profile menu"
            >
              <UserAvatar member={currentUser} size="md" />
              <span className="hidden text-left leading-tight lg:block">
                <span className="block max-w-32 truncate text-sm font-medium text-ink">{currentUser?.name}</span>
                <span className="block text-2xs text-faint">{currentUser ? ROLE_LABELS[currentUser.role] : ''}</span>
              </span>
            </button>
          )}
          groups={[
            {
              items: [
                {
                  key: 'profile',
                  label: 'Your profile',
                  icon: User,
                  onSelect: () => navigate('/admin?tab=team'),
                },
                {
                  key: 'settings',
                  label: 'Settings',
                  icon: Settings,
                  onSelect: () => navigate('/admin?tab=settings'),
                },
              ],
            },
            {
              items: [
                {
                  key: 'reset',
                  label: 'Reset demo data',
                  icon: RotateCcw,
                  onSelect: () => {
                    resetAll()
                    toast.success('Demo data reset', 'All records restored to the seed dataset.')
                  },
                },
                {
                  key: 'signout',
                  label: 'Sign out',
                  icon: LogOut,
                  onSelect: () => toast.info('Demo mode', 'Authentication is simulated in this frontend-only build.'),
                },
              ],
            },
          ]}
        />
      </div>
    </header>
  )
}
