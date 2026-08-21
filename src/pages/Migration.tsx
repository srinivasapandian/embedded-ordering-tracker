import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { MigrationBoard } from '@/components/migration/MigrationBoard'
import { MigrationDrawer } from '@/components/migration/MigrationDrawer'
import { MigrationOverviewHeader } from '@/components/migration/MigrationOverviewHeader'

export default function Migration() {
  const migrations = useAppStore((s) => s.migrations)
  const websites = useAppStore((s) => s.websites)
  const clients = useAppStore((s) => s.clients)
  const teamMembers = useAppStore((s) => s.teamMembers)
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const websiteMap = useMemo(() => new Map(websites.map((website) => [website.id, website])), [websites])
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])
  const memberMap = useMemo(() => new Map(teamMembers.map((member) => [member.id, member])), [teamMembers])

  return (
    <>
      <PageHeader
        title="Migration"
        description="Read-only view of the React → Next.js migration board — manage stage, priority and assignment from the Admin Panel."
      />

      <MigrationOverviewHeader />

      <SectionHeader
        title="Migration Board"
        description="Status across Planning → In Progress → Testing → Completed"
      />

      <MigrationBoard
        migrations={migrations}
        websiteMap={websiteMap}
        clientMap={clientMap}
        memberMap={memberMap}
        onOpenDetails={setDrawerId}
      />
      <MigrationDrawer migrationId={drawerId} onClose={() => setDrawerId(null)} readOnly />
    </>
  )
}
