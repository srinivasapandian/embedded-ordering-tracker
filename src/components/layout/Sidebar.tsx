import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Table2,
  Users,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/context/AuthContext'
import { useUiStore } from '@/store/uiStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Tooltip } from '@/components/common/Tooltip'
import { UserAvatar } from '@/components/common/UserAvatar'
import { ROLE_LABELS } from '@/types'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Client Tracker', icon: Users },
  { to: '/master-tracker', label: 'Master Tracker', icon: Table2 },
  { to: '/admin', label: 'Admin Panel', icon: ShieldCheck },
]

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  const { profile: currentUser } = useAuth()
  const isMobile = useMediaQuery('(max-width: 1023px)')

  const effectiveCollapsed = isMobile ? false : collapsed

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && mobileNavOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{
          width: effectiveCollapsed ? 68 : 240,
          x: isMobile ? (mobileNavOpen ? 0 : -272) : 0,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="fixed left-0 top-0 bottom-0 z-50 flex h-screen shrink-0 flex-col overflow-hidden border border-line bg-card lg:sticky lg:top-3 lg:my-3 lg:ml-3 lg:h-[calc(100vh-1.5rem)] lg:z-40 lg:rounded-2xl lg:shadow-float"
      >
        {/* Brand mark */}
        <div className={cn('flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4', effectiveCollapsed && 'justify-center px-0')}>
          <img src="/red-logo.webp" alt="Brisque" className="h-7 w-7 shrink-0 select-none object-contain" />
          {!effectiveCollapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold tracking-tight text-ink">Brisque Ops</span>
              <span className="block text-2xs font-medium text-faint">Operations Console</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
          {NAV_ITEMS.map((item) => {
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'focus-ring group flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium transition-colors',
                    effectiveCollapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                      : 'text-sub hover:bg-elev hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? '' : 'opacity-80')} aria-hidden />
                    {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
                    {!effectiveCollapsed && isActive && (
                      <motion.span layoutId="nav-active-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                    )}
                  </>
                )}
              </NavLink>
            )
            return effectiveCollapsed ? (
              <Tooltip key={item.to} content={item.label} side="right">
                {link}
              </Tooltip>
            ) : (
              link
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 space-y-1 border-t border-line px-2.5 py-3">
          {effectiveCollapsed ? (
            <Tooltip content="Settings" side="right">
              <NavLink
                to="/admin?tab=settings"
                className="focus-ring flex h-9 items-center justify-center rounded-md text-sub transition-colors hover:bg-elev hover:text-ink"
              >
                <Settings className="h-[18px] w-[18px]" aria-hidden />
                <span className="sr-only">Settings</span>
              </NavLink>
            </Tooltip>
          ) : (
            <NavLink
              to="/admin?tab=settings"
              className="focus-ring flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-sub transition-colors hover:bg-elev hover:text-ink"
            >
              <Settings className="h-[18px] w-[18px] opacity-80" aria-hidden />
              <span>Settings</span>
            </NavLink>
          )}

          <div className={cn('flex items-center gap-2.5 rounded-md px-2.5 py-2', effectiveCollapsed && 'justify-center px-0')}>
            {effectiveCollapsed ? (
              <UserAvatar member={currentUser} size="sm" tooltip />
            ) : (
              <>
                <UserAvatar member={currentUser} size="md" />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-medium text-ink">{currentUser?.name}</span>
                  <span className="block truncate text-2xs text-faint">
                    {currentUser ? ROLE_LABELS[currentUser.role] : ''}
                  </span>
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'focus-ring hidden h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-sub transition-colors hover:bg-elev hover:text-ink lg:flex',
              effectiveCollapsed && 'justify-center px-0',
            )}
          >
            {effectiveCollapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px] opacity-80" aria-hidden />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  )
}
