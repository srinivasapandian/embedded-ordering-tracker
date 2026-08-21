import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Boxes,
  CornerDownLeft,
  GitBranch,
  Globe,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/appStore'
import { useUiStore } from '@/store/uiStore'
import { useTheme } from '@/context/ThemeContext'
import { Kbd } from '@/components/common/Kbd'

interface PaletteItem {
  id: string
  group: string
  label: string
  sublabel?: string
  icon: LucideIcon
  keywords?: string
  perform: () => void
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const teamMembers = useAppStore((s) => s.teamMembers)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    return undefined
  }, [open])

  const close = () => setOpen(false)

  const go = (to: string) => {
    close()
    navigate(to)
  }

  const commands: PaletteItem[] = useMemo(
    () => [
      { id: 'nav-dashboard', group: 'Commands', label: 'Go to Dashboard', icon: LayoutDashboard, perform: () => go('/dashboard') },
      { id: 'nav-clients', group: 'Commands', label: 'Go to Client Tracker', icon: Users, perform: () => go('/clients') },
      { id: 'nav-features', group: 'Commands', label: 'Go to Features', icon: Boxes, perform: () => go('/features') },
      { id: 'nav-migration', group: 'Commands', label: 'Go to Migration', icon: GitBranch, perform: () => go('/migration') },
      { id: 'nav-admin', group: 'Commands', label: 'Go to Admin Panel', icon: ShieldCheck, perform: () => go('/admin') },
      { id: 'create-client', group: 'Commands', label: 'Create Client', keywords: 'new add', icon: Plus, perform: () => go('/clients?new=1') },
      { id: 'start-migration', group: 'Commands', label: 'Start Migration', keywords: 'new add create', icon: Plus, perform: () => go('/migration?new=1') },
      {
        id: 'toggle-theme',
        group: 'Commands',
        label: 'Toggle Dark Mode',
        keywords: 'theme light appearance',
        icon: theme === 'dark' ? Sun : Moon,
        perform: () => {
          toggleTheme()
          close()
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  )

  const results: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (text: string) => text.toLowerCase().includes(q)

    const cmdMatches = q
      ? commands.filter((c) => matches(c.label) || matches(c.keywords ?? ''))
      : commands

    if (!q) return cmdMatches

    const clientMatches: PaletteItem[] = clients
      .filter((c) => matches(c.name) || matches(c.location))
      .slice(0, 5)
      .map((c) => ({
        id: `client-${c.id}`,
        group: 'Clients',
        label: c.name,
        sublabel: c.location,
        icon: UserRound,
        perform: () => go(`/clients?highlight=${c.id}`),
      }))

    const websiteMatches: PaletteItem[] = websites
      .filter((w) => matches(w.name) || matches(w.domain))
      .slice(0, 5)
      .map((w) => ({
        id: `website-${w.id}`,
        group: 'Websites',
        label: w.name,
        sublabel: w.domain,
        icon: Globe,
        perform: () => go(`/admin?tab=websites&q=${encodeURIComponent(w.name)}`),
      }))

    const memberMatches: PaletteItem[] = teamMembers
      .filter((m) => matches(m.name))
      .slice(0, 4)
      .map((m) => ({
        id: `member-${m.id}`,
        group: 'Team',
        label: m.name,
        sublabel: m.title,
        icon: UserRound,
        perform: () => go('/admin?tab=team'),
      }))

    return [...cmdMatches, ...clientMatches, ...websiteMatches, ...memberMatches]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, commands, clients, websites, teamMembers])

  useEffect(() => setActiveIndex(0), [query])

  useEffect(() => {
    // Keep the active item scrolled into view.
    const list = listRef.current
    const el = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[activeIndex]?.perform()
    } else if (e.key === 'Escape') {
      close()
    }
  }

  let lastGroup = ''

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={close}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-line bg-card shadow-pop"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-palette-list"
                aria-activedescendant={results[activeIndex] ? `palette-item-${results[activeIndex].id}` : undefined}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients, websites, team — or type a command…"
                className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
              />
              <Kbd>Esc</Kbd>
            </div>

            <div ref={listRef} id="command-palette-list" role="listbox" className="max-h-[46vh] overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-sub">
                  No results for “{query}”. Try a client, website or feature name.
                </p>
              ) : (
                results.map((item, i) => {
                  const showHeader = item.group !== lastGroup
                  lastGroup = item.group
                  return (
                    <div key={item.id}>
                      {showHeader && (
                        <p className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-faint">
                          {item.group}
                        </p>
                      )}
                      <button
                        type="button"
                        role="option"
                        id={`palette-item-${item.id}`}
                        aria-selected={i === activeIndex}
                        data-index={i}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => item.perform()}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                          i === activeIndex ? 'bg-primary-50 text-primary-800 dark:bg-primary-500/15 dark:text-primary-200' : 'text-ink',
                        )}
                      >
                        <item.icon
                          className={cn('h-4 w-4 shrink-0', i === activeIndex ? 'opacity-90' : 'text-faint')}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                        {item.sublabel && <span className="max-w-40 truncate text-xs text-faint">{item.sublabel}</span>}
                        {i === activeIndex && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-line bg-elev/50 px-4 py-2 text-2xs text-faint">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd> select
              </span>
              <span className="flex items-center gap-1">
                <Kbd>Esc</Kbd> close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
