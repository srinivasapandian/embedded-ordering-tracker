import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Client Tracker',
  features: 'Features',
  migration: 'Migration',
  admin: 'Admin Panel',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link
        to="/dashboard"
        className="focus-ring flex items-center gap-1 rounded text-sub transition-colors hover:text-ink"
      >
        <Home className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden font-medium sm:inline">Brisque Emb</span>
      </Link>
      {segments.map((seg, i) => {
        const label = ROUTE_LABELS[seg] ?? seg
        const isLast = i === segments.length - 1
        const to = '/' + segments.slice(0, i + 1).join('/')
        return (
          <span key={to} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden />
            {isLast ? (
              <span aria-current="page" className="truncate font-semibold text-ink">
                {label}
              </span>
            ) : (
              <Link to={to} className="focus-ring truncate rounded font-medium text-sub hover:text-ink">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
