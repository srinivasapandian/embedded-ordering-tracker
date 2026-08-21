import { useNavigate } from 'react-router-dom'
import { LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Kbd } from '@/components/common/Kbd'
import { Tooltip } from '@/components/common/Tooltip'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { UserAvatar } from '@/components/common/UserAvatar'
import { NotificationsPopover } from './NotificationsPopover'

export function Topbar() {
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  const { theme, toggleTheme } = useTheme()
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-card/90 px-4 backdrop-blur sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sub transition-colors hover:bg-elev hover:text-ink lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" aria-hidden />
        </button>
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-sm font-bold tracking-tight text-ink">Brisque Ops</h1>
          <p className="hidden truncate text-2xs font-medium text-faint sm:block">Operations Command Center</p>
        </div>
      </div>

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
              className="focus-ring ml-1 flex items-center rounded-full p-0.5 transition-colors hover:bg-elev"
              aria-label={profile ? `Open profile menu for ${profile.name}` : 'Open profile menu'}
            >
              <UserAvatar member={profile} size="md" />
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
                  key: 'signout',
                  label: 'Sign out',
                  icon: LogOut,
                  onSelect: () => {
                    void logout().then(() => navigate('/login'))
                  },
                },
              ],
            },
          ]}
        />
      </div>
    </header>
  )
}
