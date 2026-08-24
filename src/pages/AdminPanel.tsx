import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarClock, GitBranch, Globe, LayoutDashboard, Presentation, Sparkles, Users } from 'lucide-react'
import { ClientsManager } from '@/components/admin/ClientsManager'
import { FeaturesManager } from '@/components/admin/FeaturesManager'
import { MigrationsManager } from '@/components/admin/MigrationsManager'
import { PrioritiesManager } from '@/components/admin/PrioritiesManager'
import { WebsitesManager } from '@/components/admin/WebsitesManager'
import { EmbeddedOrderingRollout } from '@/components/dashboard/EmbeddedOrderingRollout'
import { KpiStrip } from '@/components/dashboard/KpiStrip'
import { MigrationOverview } from '@/components/dashboard/MigrationOverview'
import { TechLandscape } from '@/components/dashboard/TechLandscape'
import { PresentMode } from '@/components/present/PresentMode'
import { Tabs } from '@/components/common/Tabs'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/common/Button'
import { useAppStore } from '@/store/appStore'

function DashboardTab() {
  return (
    <div className="space-y-7">
      <div className="app-card flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-sub">
          Live snapshot — every number here is computed from Client Tracker, Features and Migration data. Edit those
          tabs and this view updates automatically.
        </p>
        <Link
          to="/dashboard"
          className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-elev"
        >
          Open full Dashboard
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <KpiStrip />
      <EmbeddedOrderingRollout />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <MigrationOverview />
        </div>
        <div className="xl:col-span-2">
          <TechLandscape />
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const migrations = useAppStore((s) => s.migrations)
  const priorities = useAppStore((s) => s.priorities)
  const [activeTab, setActiveTab] = useState('clients')
  const [presenting, setPresenting] = useState(false)

  return (
    <>
      <PageHeader
        title="Admin Panel"
        description="The only place client, feature, migration and priority records get created or edited — every other page (Dashboard, Client Tracker, Features, Migration) is a read-only view of this same data."
        actions={
          <Button variant="outline" size="sm" onClick={() => setPresenting(true)}>
            <Presentation className="h-3.5 w-3.5" aria-hidden />
            Present
          </Button>
        }
      />
      <PresentMode open={presenting} onClose={() => setPresenting(false)} />
      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        layoutId="admin-panel-tabs"
        items={[
          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { key: 'clients', label: 'Client Tracker', icon: Users, count: clients.length },
          { key: 'features', label: 'Features', icon: Sparkles },
          { key: 'migration', label: 'Migration', icon: GitBranch, count: migrations.length },
          { key: 'priorities', label: 'Priorities', icon: CalendarClock, count: priorities.length },
          { key: 'websites', label: 'Websites', icon: Globe, count: websites.length },
        ]}
      />
      <div className="mt-4">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'clients' && <ClientsManager />}
        {activeTab === 'features' && <FeaturesManager />}
        {activeTab === 'migration' && <MigrationsManager />}
        {activeTab === 'priorities' && <PrioritiesManager />}
        {activeTab === 'websites' && <WebsitesManager />}
      </div>
    </>
  )
}
