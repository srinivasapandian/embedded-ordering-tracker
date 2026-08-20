import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Boxes,
  GitBranch,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/appStore'
import { useUiStore } from '@/store/uiStore'
import { Tooltip } from '@/components/common/Tooltip'
import { UserAvatar } from '@/components/common/UserAvatar'
import { ROLE_LABELS } from '@/types'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Client Tracker', icon: Users },
  { to: '/features', label: 'Features', icon: Boxes },
  { to: '/migration', label: 'Migration', icon: GitBranch },
  { to: '/admin', label: 'Admin Panel', icon: ShieldCheck },
]

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const currentUser = useAppStore((s) => s.teamMembers.find((m) => m.id === s.currentUserId))

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-line bg-card"
    >
      {/* Logo */}
      <div className={cn('flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4', collapsed && 'justify-center px-0')}>
        <span className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-sm">
          B
        </span>
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold tracking-tight text-ink">Brisque Emb</span>
            <span className="block text-2xs font-medium text-faint">Dashboard</span>
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
              className={({ isActive }) =>
                cn(
                  'focus-ring group flex h-9 items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300 border-l-2 border-primary-500 rounded-l-none pl-2'
                    : 'text-sub hover:bg-elev hover:text-ink border-l-2 border-transparent pl-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? '' : 'opacity-80')} aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && isActive && (
                    <motion.span layoutId="nav-active-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden />
                  )}
                </>
              )}
            </NavLink>
          )
          return collapsed ? (
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
        {collapsed ? (
          <Tooltip content="Settings" side="right">
            <NavLink
              to="/admin?tab=settings"
              className="focus-ring flex h-9 items-center justify-center rounded-lg text-sub transition-colors hover:bg-elev hover:text-ink"
            >
              <Settings className="h-[18px] w-[18px]" aria-hidden />
              <span className="sr-only">Settings</span>
            </NavLink>
          </Tooltip>
        ) : (
          <NavLink
            to="/admin?tab=settings"
            className="focus-ring flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-sub transition-colors hover:bg-elev hover:text-ink"
          >
            <Settings className="h-[18px] w-[18px] opacity-80" aria-hidden />
            <span>Settings</span>
          </NavLink>
        )}

        <div className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2', collapsed && 'justify-center px-0')}>
          {collapsed ? (
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
            'focus-ring flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-sub transition-colors hover:bg-elev hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
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
  )
}
