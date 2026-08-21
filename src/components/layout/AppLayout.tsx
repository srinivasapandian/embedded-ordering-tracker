import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUiStore } from '@/store/uiStore'
import { useHotkey } from '@/hooks/useHotkey'
import { useFirestoreSync } from '@/hooks/useFirestoreSync'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Skeleton } from '@/components/common/Skeleton'
import { Toaster } from '@/components/common/Toaster'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'

function PageFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-7 w-56" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

export function AppLayout() {
  const location = useLocation()
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const commandPaletteOpen = useUiStore((s) => s.commandPaletteOpen)

  // Global Ctrl/Cmd+K — works even while typing in inputs.
  useHotkey(
    'k',
    (e) => {
      e.preventDefault()
      setCommandPaletteOpen(!commandPaletteOpen)
    },
    { ctrlOrCmd: true, allowInInputs: true },
  )

  // Live Firestore sync for the whole app.
  useFirestoreSync()

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" className="min-w-0 flex-1">
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="mx-auto w-full max-w-[1600px] px-5 py-5 2xl:px-8"
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  )
}
